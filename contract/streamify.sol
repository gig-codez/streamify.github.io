// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);

  function approve(address, uint256) external returns (bool);

  function transferFrom(address, address, uint256) external returns (bool);

  function totalSupply() external view returns (uint256);

  function balanceOf(address) external view returns (uint256);

  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}



contract Pay2Watch {

    //track all uploads on the smart contract
    uint internal uplaodLength = 0;

  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    //event for a rent
    event hasBeenRented(address owner, address recipient,uint uploadId, uint amount);

    //event for a buy
    event hasBeenBought(address owner, address buyer,uint uploadId, uint amount);


    //mapping for the users
    mapping(address => bool) internal users;


    //mapping for the uploads
    mapping(uint => Upload) internal uploads;


    //mapping to rent the uploaded content
    mapping(address =>mapping(uint => bool)) internal isAllowed;



    //struct for the videos
    struct Upload{
        address payable owner;
        string title;
        string content;
        string description;
        uint amountToRent;
        uint amountToBuy;
    }

    //struct for suggested videos
    struct suggestedVideos{
      string VidTitle;
      address recipient;
      address suggestedBy;
    }

    //mapping for the suggested videos
    mapping(address => suggestedVideos[]) internal sugVideos;


    //Ttore a video
    function storeUpload(
        string memory _title,
        string memory __content,
        string memory _description,
        uint _amountToRent,
        uint _amountToBuy
        )
        public{

            uploads[uplaodLength] = Upload(

                payable(msg.sender),
                _title,
                __content,
                _description,
                _amountToRent,
                _amountToBuy
                );

            uplaodLength++;
    }



    //Rent an a video
    function rentOut(uint _index) public  {

        require(msg.sender != uploads[_index].owner,"You cant rent your own content");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            uploads[_index].owner,
            uploads[_index].amountToRent 
          ),
          "Renting out failed."
        );

        isAllowed[msg.sender][_index] = true;

        emit hasBeenRented(uploads[_index].owner, msg.sender,_index, uploads[_index].amountToRent);
    }


    //Buy a video
    function buyOut(uint _index) public  {


        require(msg.sender != uploads[_index].owner,"You cant buy your own content");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            uploads[_index].owner,
            uploads[_index].amountToBuy 
          ),
          "Buying out failed."
        );

        uploads[_index].owner = payable(msg.sender);

        isAllowed[msg.sender][_index] = true;

        emit hasBeenBought(uploads[_index].owner, msg.sender,_index, uploads[_index].amountToRent);
    }


    //Check if one is allowed to watch a certain video 
    function isAllowedToStream(uint _index) public view returns(bool){
        return isAllowed[msg.sender][_index];
    }



    //Get a video with a specific id
    function getSpecificUpload(uint _index) public view returns(Upload memory){
        return uploads[_index];
    }



    //Get the total number of video so far
    function getTotaluploads() public view returns(uint){
        return uplaodLength;
    }


   function deleteUpload(uint _index) public {
    require(msg.sender == uploads[_index].owner,"You are not authorized");

    // Remove the video from the isAllowed mapping for all users who were previously allowed to stream it
    for (uint i = 0; i < uplaodLength; i++) {
        if (isAllowed[uploads[_index].owner][i]) {
            delete isAllowed[uploads[_index].owner][i];
        }
    }

    delete uploads[_index];
}



    //Edit the price of rent or buy
    function adjustPrice(uint _index, string memory _category, uint _amount) public {

        require(msg.sender == uploads[_index].owner,"You are not authorized");

        if (keccak256(abi.encodePacked('rent')) == keccak256(abi.encodePacked(_category))) {
            uploads[_index].amountToRent = _amount;
   
       }else if (keccak256(abi.encodePacked('buy')) == keccak256(abi.encodePacked(_category))) {
        uploads[_index].amountToBuy = _amount;

     }

    }

     //Allow someone else to watch your video (in rent mode)
     function rent4Me(uint _index, address _recipient) public {
       require(uploads[_index].owner == msg.sender,"you dont own this video");
       isAllowed[_recipient][_index] = true;
     }


     //suggest video to someone else
     function suggestVideo(string memory _vidTitle, address _recipient) public{
       sugVideos[_recipient].push(suggestedVideos(
         _vidTitle,
         _recipient,
         msg.sender
       ));
     }

     //return suggested videos
  function getSuggestedVideos() public view returns(suggestedVideos[] memory){
    return sugVideos[msg.sender];
  }


    }