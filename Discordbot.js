const Discord = require("discord.js");
const client = new Discord.Client();
const prefix = "!";
const request = require('request');
const sortJson = require('sort-json');
var plotly = require('plotly')('PLOTY USER NAME', 'PLOTLY USER KEY'); //Plotly user key
var fs = require('fs');
var itemList = JSON.parse(fs.readFileSync('./RSObjects.json', 'utf8')); //Parse the large json file of runescape items

itemList.sort(function(a, b) {
          var x = a.name.toLowerCase();
          var y = b.name.toLowerCase();
          if (x < y) {return -1;}
          if (x > y) {return 1;}
          return 0;
});
client.on("ready", () => {
  console.log("I am ready!");
});
client.on("message", (message) => {
  const args = message.content.slice(prefix.length).trim().split("."); //Parse and read in user message in chat
	const command = args.shift().toLowerCase();
  var text;
  var inputURL;
	if (!message.content.startsWith(prefix) || message.author.bot) return;
console.log("Command received: "+command+" Arguments: "+args);
if (command === 'stats' || command === 'price' || command === 'graph' || command === 'help'){ //Check for valid command entered in chat
  console.log("Valid command.");
} else {
  message.channel.send("Command not recognized.  Please type !help for help.");
}
if (command === 'help'){ //Privately message user with possible commands
  const embed = {
    "color": 14462206,
    "fields": [
      {
        "name": "Player stats lookup: ",
        "value": "!stats.skill.playername\n!stats.skill.playername1.playername2\n*Use skill=combat to show all combat stats."
      },
      {
        "name": "Item lookup: ",
        "value": "!price.itemname"
      },
      {
        "name": "Item history lookup: ",
        "value": "!graph.itemname"
      },
      {
        "name": "Help: ",
        "value": "!help"
      }
    ]
  };
  message.author.send({ embed }); //Send the formatted direct message
  message.channel.send("Check your direct messages for help."); //Let user know they received a direct message
}
  if (command === 'graph'){ //Attempt to display a time series plot of item prices
    itemname = args[0];
    days = args[1];
    var itemid;
    var itemfound=0;
    var itemname;
    for (i=0; i<itemList.length; i++){
      if (itemList[i].name.toLowerCase() === itemname.toLowerCase()){ //Search list of items for a match and grab id
        itemid = itemList[i].id;
        console.log("Found item: id "+itemid);
        itemfound=1;
        itemname=itemList[i].name;
        break;
      }
    }
    if(itemfound===1){
    var fullText;
    inputURL = 'http://services.runescape.com/m=itemdb_oldschool/api/graph/'+itemid+'.json'; //Grab values from runescape api of past prices
    request(inputURL, function(err, res, body) {
    text = body;
    fullText = body
    fullText = fullText.split("average");
    fullText = fullText[0].substr(11);
    fullText = fullText.replace(/"/g,"");
    fullText = fullText.replace(/:\s*/g,",");
    fullText = fullText.split(",");
    var vx = []
    var vy = []
    //Push values to lists for time and price axes
    for (n=0; n<fullText.length; n=n+2){
      vx.push(fullText[n]/86400000-fullText[0]/86400000);
    }
    vx=vx.slice(0,-1);
    for (n=1; n<fullText.length-1; n=n+2){
      vy.push(fullText[n]);
    }
    //Format the plotly image
    var trace1 = {
    x: vx,
    y: vy,
    mode: 'line',
    line: {
    color: 'rgb(240, 80, 80)',
    width: 2
  },
  opacity:.8
    };
    var imgOpts = {
        format: 'jpeg',
        width: 600,
        height: 300
    };
    var layout = {
      paper_bgcolor:'rgb(256, 256, 256)',
      plot_bgcolor:'rgb(230, 230, 230)',
title: itemname+" Daily Prices",
font: {
family: "Arial",
size: 16,
color: 'rgb(100, 100, 100)'
},
yaxis: {
  size: 10,
  title: "Daily Prices",
  gridcolor: 'rgb(256, 256, 256)',
  autorange: true,
  showgrid: true,
  zeroline: false,
  showline: true,
  autotick: true,
  //dtick:20,
  ticks: "",
  showticklabels: true
},
xaxis: {
  size: 10,
  title: "Days (Past to Present)",
  autorange: true,
  showgrid: true,
  gridcolor: 'rgb(256, 256, 256)',
  zeroline: false,
  showline: true,
  //autotick: true,
  ticks: "",
  ticklen: 2,
  tickwidth: 1,
  dtick:20,
  showticklabels: true
}
};
    var figure = { 'data': [trace1],layout: layout};
    plotly.getImage(figure, imgOpts,function (error, imageStream) {
        if (error) return console.log (error);
        var fileStream = fs.createWriteStream('1.jpg');
        imageStream.pipe(fileStream); //Save image locally to the server
    });
    function sendMessage(){
        message.channel.send( //Send the saved image to the discord chat
          {"files":
          ["./1.jpg"]
          }
      );
    }
    setTimeout(sendMessage,2000);
    }); //end request
  } else {
    message.channel.send("Item not found.");
  }
}

  if (command === 'price'){ //Attempt to get price of item
    itemname = args[0];
    if (itemname == null) {
      message.channel.send("Command not recognized.  Please type !help for help.");
    } else {
    var itemid;
    var nearLoc=-1;
    var itemfound=0;
    var c;
    var x;
    c = itemname.length-1
    for (i=0; i<itemList.length; i++){
      if (itemList[i].name.toLowerCase() === itemname.toLowerCase()){ //Search for item in list of possible items
        itemid = itemList[i].id;
        console.log("Found item: id "+itemid);
        itemfound=1;
        break;
      }
    }
    console.log("No exact matching item found.  Finding related items.  ");
    x=c;
    while (itemfound===0 && nearLoc===-1){ //If no item is found for what user entered, find the place in list closest to what was entered
      console.log("No related item found.  ");
      console.log("Testing:  "+itemname.substr(0,x));
      for (i=0; i<itemList.length; i++){
        if (itemList[i].name.toLowerCase().startsWith(itemname.substr(0,x).toLowerCase())) {
          nearLoc = i;
          console.log("Found related item.  ");
          break;
        }
      }
      x=x-1;
    }
    if(itemfound===1){
    inputURL = 'http://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item='+itemid; //Grab item details from RS API
    request(inputURL, function(err, res, body) {
    text = body;
    var fullText = body
    fullText = fullText.split(",\"");
    var fname = fullText[5].replace(/"/g," ").replace(/}/g," "); //Grab item name
    fname = fname.substr(7);
    var fprice = fullText[8].replace(/"/g," ").replace(/}/g," "); //Grab item price
    console.log(fprice);
    fprice = fprice.substr(7);
    var fdesc = fullText[6].replace(/"/g," ").replace(/}/g," "); //Grab item description
    fdesc = fdesc.substr(14);
    const embed = { //Format the information nicely
      "color": 14462206,
      "fields": [
        {
          "name": "Item Name: ",
          "value": " "+fname
        },
        {
          "name": "Description:",
          "value": " "+fdesc
        },
        {
          "name": "Price:",
          "value": " "+fprice
        }
      ]
    };
    message.channel.send({ embed }); //Output results to chat
  });
} else { //If no item is found for what user entered then display similar items by name
    if (nearLoc+2<itemList.length && nearLoc-2>=0){
    message.channel.send("**Item not found.  Similar items: **"+itemList[nearLoc-2].name+", "+itemList[nearLoc-1].name+", "+itemList[nearLoc].name+", "+itemList[nearLoc+1].name+", "+itemList[nearLoc+2].name);
  } else if (nearLoc+5<itemList.length) {
    message.channel.send("**Item not found.  Similar items: **"+itemList[nearLoc].name+", "+itemList[nearLoc+1].name+", "+itemList[nearLoc+2].name+", "+itemList[nearLoc+3].name+", "+itemList[nearLoc+4].name);
  } else if (nearLoc-5>0) {
    message.channel.send("**Item not found.  Similar items: **"+itemList[nearLoc].name+", "+itemList[nearLoc-1].name+", "+itemList[nearLoc-2].name+", "+itemList[nearLoc-3].name+", "+itemList[nearLoc-4].name);
  } else {
    message.channel.send("**Item not found.  Similar items: **"+itemList[nearLoc].name);

  }
}
}
}

		if(command === 'stats') { //Attempt to display stats of player(s)
      skillname = args[0];
      playername=args[1];
      playername2=args[2];
      inputURL = 'http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player='+playername;
    request(inputURL, function(err, res, body) {
      text = body;
      var fullText = body.replace(/\n/g, ",");
      var found;
      if (fullText.includes("Page not found")){ //If no player by name exists, let user know
        found = false;
        message.channel.send("**Player not found.**");
      } else {
        found=true
        console.log("Found player1");
      }

      fullText = fullText.split(",");
      //Possible skills in Runescape
      var skills = ["Total","Attack","Defence","Strength","Hitpoints","Ranged","Prayer","Magic","Cooking","Woodcutting","Fletching","Fishing","Firemaking","Crafting","Smithing","Mining"
      ,"Herblore","Agility","Thieving","Slayer","Farming","Runecraft","Hunter","Construction"];
      //Initialize lists to store data
      var rank=[];
      var level=[];
      var xp=[];
      var i=0;
      for (row=0; row<skills.length;row++){ //Parse html for vaues
          rank[row]=fullText[i];
          level[row]=fullText[i+1];
          xp[row]=fullText[i+2];
          i+=3;
      }
      var skillnumber;
      for (n=0; n<skills.length;n++){
          if (skillname.toUpperCase() === skills[n].toUpperCase()) { //Get skill index
            skillnumber=n;
            break;
          }
      }
      const embed2 = { //Format data
        "color": 14462206,
        "fields": [
          {
            "name": "Player name: ",
            "value": " "+playername
          },
          {
            "name": "Combat Stats Levels: ",
            "value": "**Attack:** "+level[1]+" **Defense:** "+level[2]+" **Strength:** "+level[3]+" **Hitpoints:** "+level[4]+"\n**Ranged:** "+level[5]+"** Prayer:** "+level[6]+" **Magic:** "+level[7]
          }
        ]
      };
      const embed1 = {
        "color": 14462206,
        "fields": [
          {
            "name": "Player name: ",
            "value": " "+playername
          },
          {
            "name": "Skill: ",
            "value": " "+skills[skillnumber]
          },
          {
            "name": "Rank: ",
            "value": " "+rank[skillnumber]
          },
          {
            "name": "Level: ",
            "value": " "+level[skillnumber]
          },
          {
            "name": "XP: ",
            "value": " "+xp[skillnumber]
          }
        ]
      };

 var embed;
 if (skillname.toUpperCase()==='COMBAT'){ //Display only combat stats
   embed=embed2
 }else{ //Display all other stats
   embed=embed1
 }

 if (found === true && (playername2==null)){ //Repeat if there is a second player being compared, perform a new api request
      message.channel.send({ embed });
    } else if (playername2!=null){
    var inputURL2 = 'http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player='+playername2;
    request(inputURL2, function(err, res, body) {
      text = body;
      var fullText2 = body.replace(/\n/g, ",");
      var found2;
      if (fullText2.includes("Page not found")){
        found2 = false;
        message.channel.send("**Player 2 not found.**");
      } else {
        found2=true
        console.log("Found player2");
      }

      fullText2 = fullText2.split(",");
      var rank2=[];
      var level2=[];
      var xp2=[];
      var i2=0;
      for (row=0; row<skills.length;row++){
          rank2.push(fullText2[i2]);
          level2.push(fullText2[i2+1]);
          xp2.push(fullText2[i2+2]);
          i2+=3;
      }

      const embed2 = {
        "color": 14462206,
        "fields": [
          {
            "name": "Player name: ",
            "value": " "+playername
          },
          {
            "name": "Combat Stats Levels: ",
            "value": "**Attack:** "+level[1]+" **Defense:** "+level[2]+" **Strength:** "+level[3]+" **Hitpoints:** "+level[4]+"\n**Ranged:** "+level[5]+"** Prayer:** "+level[6]+" **Magic:** "+level[7]
          },
          {
            "name": "Player name: ",
            "value": " "+playername2
          },
          {
            "name": "Combat Stats Levels: ",
            "value": "**Attack:** "+level2[1]+" **Defense:** "+level2[2]+" **Strength:** "+level2[3]+" **Hitpoints:** "+level2[4]+"\n**Ranged:** "+level2[5]+"** Prayer:** "+level2[6]+" **Magic:** "+level2[7]
          }
        ]
      };

      const embed1 = {
        "color": 14462206,
        "fields": [
          {
            "name": "Skill: ",
            "value": " "+skills[skillnumber]
          },
          {
            "name": playername+" Rank: ",
            "value": " "+rank[skillnumber]
          },
          {
            "name": playername2+" Rank: ",
            "value": " "+rank2[skillnumber]
          },
          {
            "name": playername+" Level: ",
            "value": " "+level[skillnumber]
          },
          {
            "name": playername2+" Level: ",
            "value": " "+level2[skillnumber]
          },
          {
            "name": playername+" XP: ",
            "value": " "+xp[skillnumber]
          },
          {
            "name": playername2+" XP: ",
            "value": " "+xp2[skillnumber]
          }
        ]
      };

      var embed;
      if (skillname.toUpperCase()==='COMBAT'){
        //attack1 str3 defence2 ranged5 magic7 prayer6 hitpoints4
        embed=embed2;
      }else{
        embed=embed1;
      }

 if (found === true){
      message.channel.send({ embed });
    }
  });//End Request
}
  });//End Request
  }
});

client.login("DISCORD BOT LOGIN KEY");
