
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import marketplaceAbi from '../contract/streamify.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18

const MPContractAddress = "0x697a732B4444EDc5E3A9D806863547e7F3E32831"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let accounts


//connect celo wallet
const connectCeloWallet = async function () {
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to use it.")
      await window.celo.enable()
      notificationOff()
      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
      
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}


//approve the address to spend the specified amount
async function approve(_price) {
        const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

        const result = await cUSDContract.methods
          .approve(MPContractAddress, _price)
          .send({ from: kit.defaultAccount })
        return result
      }



//get balance form the smart contract
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}


//when the window loads for the first time
window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getHomeVideos()
  notificationOff()
});



//save new upload from the modal
document
  .querySelector("#saveUpload")
  .addEventListener("click", async (e) => {
    
    const params = [

      document.getElementById("uploadTitle").value,
      document.getElementById("uploadUrl").value,
      document.getElementById("uploadDesc").value,
      new BigNumber(document.getElementById("amountToRent").value)
              .shiftedBy(ERC20_DECIMALS)
              .toString(),
      new BigNumber(document.getElementById("amountToBuy").value)
              .shiftedBy(ERC20_DECIMALS)
              .toString()
    ]

    notification(`⌛ Adding "${params[0]}"...`)

     try {

      const result = await contract.methods
        .storeUpload(...params)
        .send({ from: kit.defaultAccount })

        notification(`🎉 You successfully added "${params[0]}".`)
    } catch (error) {
      notification(`⚠️ ${error}`)
    }
   await getMyVideos()
    
  })



//Rent a video 
  document
    .querySelector("#marketplace")
    .addEventListener("click", async(e) => {
        if(e.target.className.includes("rentBtn"))
        {
            const index = e.target.id
            const price =e.target.getAttribute("price")

            notification("⌛ Waiting for payment approval... ⌛")
            try{
                await approve(price)
            }
            catch(error){
                notification(`⚠️ ${error}. ⚠️`)          
                 }
             notification(`⌛ Awaiting for payment of ${BigNumber(price).shiftedBy(-ERC20_DECIMALS)} cUSD ⌛`)
            try{ 
                const result = await contract.methods.rentOut(index)
                .send({from: kit.defaultAccount})
                notification(`🎉 Sucess! Thanks for renting! 🎉`)
                
            }
            catch(error) {
                notification("Renting video failed...")
            }
            await getHomeVideos()
        }
    })



    //Buy video
  document
    .querySelector("#marketplace")
    .addEventListener("click", async(e) => {
        if(e.target.className.includes("buyBtn"))
        {
            const index = e.target.id
            const price =e.target.getAttribute("price")

            notification("⌛ Waiting for payment approval... ⌛")
            try{
                await approve(price)
            }
            catch(error){
                notification(`⚠️ ${error}. ⚠️`)          
                 }
             notification(`⌛ Awaiting for payment of ${BigNumber(price).shiftedBy(-ERC20_DECIMALS)} cUSD ⌛`)
            try{ 
                const result = await contract.methods.buyOut(index)
                .send({from: kit.defaultAccount})
                notification(`🎉 Sucess! Thanks for renting! 🎉`)
                
            }
            catch(error) {
                notification("Buying video failed...")
               
            }
            await getMyVideos()

        }
    })


//Delete an upload
      document
    .querySelector("#marketplace")
    .addEventListener("click", async(e) => {
        if(e.target.className.includes("delBtn"))
        {
            const index = e.target.id
             notification("⚠️ Deleting an upload... ⌛")
        
            try{ 
                const result = await contract.methods.deleteUpload(index)
                .send({from: kit.defaultAccount})
                notification(`🎉 Sucess! Thanks for renting! 🎉`)
                
            }
            catch(error) {
                notification("Delete failed")
            }
            await getMyVideos()
        }
    })



//load home videos
    document
  .querySelector("#homeVideos")
  .addEventListener("click", async (e) => {
    getHomeVideos()
  })


//load my videos
    document
  .querySelector("#myVideos")
  .addEventListener("click", async (e) => {
    getMyVideos()
  })

  //load suggestions
    document
  .querySelector("#mySuggestions")
  .addEventListener("click", async (e) => {
    getSuggestedVideos()

})


//grant access to user to watch your video
  document
  .querySelector("#rentButton")
  .addEventListener("click", async (e) => {

    notification("Granting access...")
    const params = [

      document.getElementById("videoId").value,
      document.getElementById("rentAddress").value
    ]

    try{
        const result = await contract.methods
            .rent4Me(...params)
            .send({from: kit.defaultAccount})

           notification(`You have granted access to ${params[1]} to watch video with id ${params[0]}`)
    }catch(e){
        notification("Faile action..")
    }

    notificationOff()  
})



//suggest a video to another user.
  document
  .querySelector("#suggestButton")
  .addEventListener("click", async (e) => {

    notification(" Saving video suggestion...")
    const params = [

      document.getElementById("videoTitle").value,
      document.getElementById("userAddress").value
    ]

    try{
        const result = await contract.methods
             .suggestVideo(...params)
             .send({from: kit.defaultAccount})

             notification(`You have suggested ${params[1]} to watch video with id ${params[0]}`)
    }catch(e){
        notification("Suggestion failed")
    }

    notificationOff()  
})

//fetch all videos
async function fetchVideos(){

      let uploads = []

    try{
    const uploadLength = await contract.methods.getTotaluploads().call()

    for (let i = 0; i < uploadLength; i++) {

         let isA  =  await contract.methods.isAllowedToStream(i).call()
         let r    =  await contract.methods.getSpecificUpload(i).call()
            uploads.push({
                index: i,
                isAllowed:isA,
                owner: r[0],
                content:r[2],
                title:r[1],
                description:r[3],
                amountToRent:r[4],
                amountToBuy:r[5]
            })
    }

    return uploads

}catch(e){
    notification("fetching videos failed")
  }

}



//get home videos
const getHomeVideos = async function() {

    const videos = await fetchVideos()
    homeVideos(videos)
}



//render videos on the homepage
function homeVideos(uploads) {
  
  document.getElementById("marketplace").innerHTML = ""
  document.getElementById("marketplace").style.backgroundColor = "rgb(107,124,109)"
  uploads.forEach((upload) => {
    if(upload.owner!="0x0000000000000000000000000000000000000000" && upload.owner != kit.defaultAccount){
      
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-3 mt-3"
    newDiv.innerHTML = homeShow(upload)
    document.getElementById("marketplace").appendChild(newDiv)
   }
  })
  }


  function homeShow(video){
    if(video.isAllowed){

       return `
      <div class="card bg-dark">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start"> 
      ${video.index}
      </div>

        <div class="card-body text-white">
            <video src="${video.content}" muted controls class="card-img-top"></video>
          <h5 class="card-title">${video.title}</h5>
          <p class="card-text">${video.description}</p>
          <p>
          <span class="card-text">Rent: ${BigNumber(video.amountToRent).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          <span class="card-text">Buy: ${BigNumber(video.amountToBuy).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          </p>
          <button href="#" class="btn btn-secondary" disabled=true>Rent</button>
          <a href="#" class="btn btn-primary buyBtn" id="${video.index}" price=${video.amountToBuy}>Buy </a>
        </div>
      `

    }else{

       return `
      <div class="card bg-dark">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start"> 
      ${video.index}
      </div>

        <div class="card-body text-white">
            <img class="card-img-top" src="https://thumbs2.imgbox.com/ab/fa/RJEORQ7s_t.png" alt="image host"/>
          <h5 class="card-title">${video.title}</h5>
          <p class="card-text">${video.description}</p>
          <p>
          <span class="card-text">Rent: ${BigNumber(video.amountToRent).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          <span class="card-text">Buy: ${BigNumber(video.amountToBuy).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          </p>
          <button href="#" class="btn btn-secondary rentBtn" id="${video.index}" price=${video.amountToRent}>Rent </button>
          <a href="#" class="btn btn-primary buyBtn" id="${video.index}" price=${video.amountToBuy}>Buy </a>
        </div>
    `
    }
  }


//fetch my videos
const getMyVideos = async function() {
    const videos = await fetchVideos()
    myVideos(videos)
}

//render my videos
function myVideos(uploads) {
 
  document.getElementById("marketplace").innerHTML = ""
  document.getElementById("marketplace").style.backgroundColor = "rgb(107,124,109)"
  uploads.forEach((upload) => {
    if(upload.owner == kit.defaultAccount){
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-3 mt-3"
    newDiv.innerHTML = myVids(upload)
    document.getElementById("marketplace").appendChild(newDiv)
   }
  })
  }

  function myVids(video){
       return `
      <div class="card bg-dark">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-end"> 
      ${video.index}
      </div>
        <div class="card-body text-white">
            <video src="${video.content}" muted controls class="card-img-top"></video>
          <h5 class="card-title">${video.title}</h5>
          <p class="card-text">${video.description}</p>
          <p>
          <span class="card-text">Rent: ${BigNumber(video.amountToRent).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          <span class="card-text">Buy: ${BigNumber(video.amountToBuy).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
          </p>
          <button href="#" class="btn btn-secondary delBtn" id=${video.index}>Delete</button>
          <a href="#" class="btn btn-primary setPrice" id="${video.index}">Set Price </a>
        </div>
      `

  }


//Edit the price
        document
    .querySelector("#marketplace")
    .addEventListener("click", async(e) => {
        if(e.target.className.includes("savePrice"))
        {
            const index = e.target.id
            const _cat = document.getElementById(`type${index}`).value
            const _amount = BigNumber(document.getElementById(`amount${index}`).value).shiftedBy(ERC20_DECIMALS)

             notification("⚠️ Updating the price... ⌛")
            
            try{ 
                const result = await contract.methods.adjustPrice(index,_cat,_amount)
                .send({from: kit.defaultAccount})
                notification(`🎉 Update successful! 🎉`)   
            }
            catch(error) {
                notification("Update failed")   
            }
             await getMyVideos()
        }
    })



/// Edit price window
document.querySelector("#marketplace").addEventListener("click", async (e) => {
    if(e.target.className.includes("setPrice")){
      const _id = e.target.id;
      
      try {

        const upload = await contract.methods
        .getSpecificUpload(_id)
        .call()

        document.getElementById("marketplace").style.backgroundColor = "rgb(107,124,109)"
        document.getElementById("marketplace").innerHTML = `
            <div style="width: 350px; margin:auto">
             <div class="card bg-dark">
                    <h2 class="card-title fs-4 fw-bold mt-2 ml-6 text-white align-text-center">Update Price</h2>
                    <div class="card-body text-white">
                        <video src="${upload.content}" muted controls class="card-img-top"></video>
                      <h5 class="card-title">${upload.title}</h5>
                      <p>
                      <span class="card-text">Rent: ${BigNumber(upload.amountToRent).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
                      <span class="card-text">Buy: ${BigNumber(upload.amountToBuy).shiftedBy(-ERC20_DECIMALS)}cUSD</span>
                      </p>
                        <label for="types">Choose Type:</label>
                        <select name="type" id="type${_id}" class="form-control" required>
                            <option value="rent">Rent</option>
                            <option value="buy">Buy</option>
                          </select>
                          <br>

                          <form>
                            <div class="col">
                                <input type="text" id="amount${_id}" class="form-control mb-2" placeholder="Enter amount...">
                             </div>
                           </form>
                         <a href="#" class="btn btn-primary savePrice" id="${_id}">Set Price </a>
                    </div
                    </div>  `
    }
    catch (error) {
      notification("Editing price failed")
    }
    notificationOff()
  }
})


//Dsiplay suggested videos
async function getSuggestedVideos(){

    const results = await contract.methods
                    .getSuggestedVideos()
                    .call()
                   
        document.getElementById("marketplace").style.backgroundColor = "rgb(107,124,109)"
        document.getElementById("marketplace").innerHTML = `

             <div style="width: 350px; margin:auto" class="mt-10">
             <div class="card bg-dark" style="width: 250px; margin:auto">
                    <h2 class="card-title fs-4 fw-bold text-white justify-content-center">Suggested Videos</h2>
                    <div class="card-body text-white" id="suggestions">   
                 </div
                </div>
        `
        if(results.length > 0){
        results.forEach((result) =>{
            const newP = document.createElement("p")

            newP.innerHTML= `${result.VidTitle} suggested by ${result.suggestedBy}`
            document.getElementById("suggestions").appendChild(newP)
        })

    }else{

        const newP = document.createElement("p")

            newP.innerHTML= "No one has suggested a video for you yet."
            document.getElementById("suggestions").appendChild(newP)
    }     
}


//function to turn notifications on.
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}






































































