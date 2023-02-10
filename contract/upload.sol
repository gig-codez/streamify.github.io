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



contract P2Watch {

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



    //struct for the uploads
    struct Upload{
      address payable owner;
      string title;
      string content;
      string description;
      uint amountToRent;
      uint amountToBuy;
    }

    //struct for suggsted videos

    struct suggestedVideos{
      string title;
      address suggestedBy;
    }

    //maping for the suggested videos
    mapping(address => suggestedVideos[]) internal sugVideos;


    //store an upload
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



    // function to rent an upload
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


    // function to buy an upload's copyrights
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


    //function to check if oneis allowed to stream a video or audio
    function isAllowedToStream(uint _index) public view returns(bool){
      return isAllowed[msg.sender][_index];
    }



    //function to get an upload with a specific id
    function getSpecificUpload(uint _index) public view returns(Upload memory){
      return uploads[_index];
    }


    //function to get the total number of uploads so far
    function getTotaluploads() public view returns(uint){
      return uplaodLength;
    }


    //function to delete an upload
    function deleteUpload(uint _index) public {

      require(msg.sender == uploads[_index].owner,"You are not authorized");

      delete uploads[_index];
    }


    //function to adjust the price of rent or buy
    function adjustPrice(uint _index, string memory _category, uint _amount) public {

      require(msg.sender == uploads[_index].owner,"You are not authorized");

        if (keccak256(abi.encodePacked('rent')) == keccak256(abi.encodePacked(_category))) {
            uploads[_index].amountToRent = _amount;
   
       }else if (keccak256(abi.encodePacked('buy')) == keccak256(abi.encodePacked(_category))) {
        uploads[_index].amountToBuy = _amount;

     }

    }

     //function to rent a video for someone else
     function rent4Me(uint _index, address _recipient) public {
       require(uploads[_index].owner == msg.sender,"you dont own this video");
       isAllowed[_recipient][_index] = true;
     }


     //suggest video to someone else
     function suggestVideo(string memory _title, address _recipient) public{
       sugVideos[_recipient].push(suggestedVideos(
         _title,
         msg.sender
       ));

     }


    }



























}