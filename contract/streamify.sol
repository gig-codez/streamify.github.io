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
  uint internal uploadLength;

  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


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


    //mapping for the users
    mapping(address => bool) internal users;


    //mapping for the uploads
    mapping(uint => Upload) internal uploads;


    //mapping to rent the uploaded content
    mapping(address =>mapping(uint => bool)) internal isAllowed;




    //mapping for the suggested videos
    mapping(address => suggestedVideos[]) internal sugVideos;

    //event for a rent
    event hasBeenRented(address owner, address recipient,uint uploadId, uint amount);

    //event for a buy
    event hasBeenBought(address owner, address buyer,uint uploadId, uint amount);

    modifier notOwner(uint _index) {
      require(msg.sender != uploads[_index].owner,"Owner can't do this action");
      _;
    }

    modifier onlyOwner(uint _index){
      require(msg.sender == uploads[_index].owner,"Now owner");
      _;
    }

    //Ttore a video
    function storeUpload(
        string memory _title,
        string memory __content,
        string memory _description,
        uint _amountToRent,
        uint _amountToBuy
        )
    public{
      uploads[uploadLength] = Upload(
        payable(msg.sender),
        _title,
        __content,
        _description,
        _amountToRent,
        _amountToBuy
      );

      uploadLength++;
    }

    //Rent an a video
    function rentOut(uint _index) public  notOwner(_index){
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
    function buyOut(uint _index) public  notOwner(_index){
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

    //Delete an video
    function deleteUpload(uint _index) public onlyOwner(_index){
      delete uploads[_index];
    }


    //Edit the price of rent or buy
    function adjustPrice(uint _index, string memory _category, uint _amount) public onlyOwner(_index){

      if (keccak256(abi.encodePacked('rent')) == keccak256(abi.encodePacked(_category))) {
        uploads[_index].amountToRent = _amount;

      }
      else if (keccak256(abi.encodePacked('buy')) == keccak256(abi.encodePacked(_category))) {
        uploads[_index].amountToBuy = _amount;
      }

    }

     //Allow someone else to watch your video (in rent mode)
     function rent4Me(uint _index, address _recipient) public onlyOwner(_index){
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
        return uploadLength;
    }

  //return suggested videos
  function getSuggestedVideos() public view returns(suggestedVideos[] memory){
    return sugVideos[msg.sender];
  }
}