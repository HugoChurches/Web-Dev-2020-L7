console.log("OK! Server's up!");

//API KEY on record
const API_TOKEN = "2abbf7c3-245b-404f-9473-ade729ed4653"
//Require the following dependencies
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const {uuid} = require('uuidv4');
const jsonParser = bodyParser.json();

//Bookmark structure!
/* const post = {
    id : uuid.v4(),
    title : String,
    description : String,
    url : String,
    rating : number
} */

//Bookmark "Database"
let post = [
    {
    id : "2e6d6cb2-87c0-4767-b180-46e5ab786b8e",
    title : "Create, read, update and delete",
    description : "This is a CRUD bookmark",
    url : "https://en.wikipedia.org/wiki/Create,_read,_update_and_delete",
    rating : 1
    },

    {
    id : "0e4f4569-2ce8-405a-88bf-7d0d50579ed6",
    title : "Base Bias of a BJT Transistor",
    description : "Help with Base Bias Voltage/Current Calculations",
    url : "http://www.learningaboutelectronics.com/Articles/Base-bias-of-a-BJT-transistor",
    rating : 1
    },

    {
    id : "f24f3ee7-2220-4e98-9aef-c47ca959f060",
    title : "List of HTTP status codes",
    description : "Response codes for HTTP",
    url : "https://en.wikipedia.org/wiki/List_of_HTTP_status_codes",
    rating : 1
    }
    ]

//Start dependencies
const bookMApp = express();
bookMApp.use(morgan('dev'));

//Define Middleware for authentification checks
function validateKey(req, res, next){
    let token = req.headers.authorization;

    //Prevent further access if no API KEY was provided
    if(!token){
        res.statusMessage = "No API KEY found in header/bearer";
        return res.status(401).end();
    }

    //Prevent further access if the API KEY provided doesn't match to the one on records
    if(token !== `Bearer ${API_TOKEN}`){
        res.statusMessage = "The API KEY you provided doesn't match to my records";
        return res.status(401).end();
    }

    //Place next() otherwise the server will indefinitely be stuck on this function
    next();
}

//Indicate the script to make the endpoints always use the validateKey middleware
bookMApp.use(validateKey);

//Endpoint for /bookmarks PATCH
bookMApp.patch('/bookmark/:id', jsonParser, (req, res) =>{
    
    //Declare an iterator to find position of the found ID
    let iterator = null;
    let JSONdata = ('body', req.body);

    //Just to check if the parameters and body is being passed correctly
    //console.log("Body field test", req.body.id);
    //console.log("Params field test", req.params.id);

    //Test if the body's ID was sent through 
    if(!req.body.id){
        res.statusMessage = "Patch unsuccessful, body is missing ID parameter";
        return res.status(406).end();
    }

    //Test if body and parameters are matching
    if(req.body.id != req.params.id){
        res.statusMessage = "Patch unsuccessful, ID mismatch on body and parameter fields"
        return res.status(409).end();
    }

    //Iterate through the bookmarks
    for(let i = 0; i < post.length; i++)
    {
        if(JSONdata.id === post[i].id )
        {
            iterator = i;
        }
    }

    //Check if iterator has something, if not then quit the execution
    if(iterator == null)
    {
        res.statusMessage = "Patch unsuccessful, ID not found in bookmarks";
        return res.status(404).end();
    }

    //Replace everything with the updated information from the body's JSON
    post[iterator].title = JSONdata.title;
    post[iterator].description = JSONdata.description;
    post[iterator].url = JSONdata.url;
    post[iterator].rating = JSONdata.rating;

    //Exit after patching
    res.statusMessage = "Patch successful";
    return res.status(200).end();
});

//Endpoint for /bookmarks delete
bookMApp.delete('/bookmarks/:id', (req, res) =>{
    //Get the id sent by Postman
    let idQuery = req.params.id;
    //Assign a null to the position
    let position = null;

    //Iterate through the "database"
    for(let i = 0; i < post.length; i++)
    {
        if(idQuery === post[i].id){
                //If matching ID found give it to the position marker
                position = i;
            }
    }

    //If position is still null then quit the delete bookmark
    if(position === null)
    {
        res.statusMessage = "No matching ID found";
        return res.status(404).end();
    }

    //Remove the bookmark from the array
    post.splice(position, 1);
    res.statusMessage = "Deletion successful";
    return res.status(200).end();
});

//Endpoint for /bookmarks POST
//Remember to parse the body with jsonParser otherwise it will look wrong
bookMApp.post('/bookmarks', jsonParser, (req, res) =>{
    console.log("body", req.body);

    //Give the JSON body to a variable
    let JSONdata = ('body', req.body);
    //Verify that the JSON is not empty, if it is stop the execution and send error message & code
    if(Object.keys(JSONdata).length === 0)
    {
        res.statusMessage = "No parameters were sent, stopping";
        return res.status(406).end();
    }

    let bmId = uuid();
    let bmTitle = JSONdata.title;
    let bmDescription = JSONdata.description;
    let bmUrl = JSONdata.url;
    let bmRating = JSONdata.rating;

    //If the JSON is not empty then verify that it was filled with the correct properties
    if(!bmTitle || !bmDescription || !bmUrl || !bmRating)
    {
        res.statusMessage = "Parameters were sent incompletely, stopping";
        return res.status(406).end();
    }

    //Body structure to test on Postman and to build with an automatically generated id
/*     {
        id : "x <=== Do not include this one, this one is generated by the endpoint",
        title : "Title of bookmark",
        description : "A simple description",
        url : "https://somelinkfromtheweb.com",
        rating : An integer for the rating
    } */

    //Generate a new JSON before appending it into the bookmark list
    let post_new = {
        id : bmId,
        title : bmTitle,
        description : bmDescription,
        url : bmUrl,
        rating : bmRating
    }

    //If above conditions were met then simply add the new bookmark to the "database"
    post.push(post_new);
    res.statusMessage = "Completed addition, here's the new bookmark";
    return res.status(200).json({post_new});
})

//Endpoint for /bookmark?title=value GET query 
bookMApp.get('/bookmark', jsonParser,(req, res)=>{
    console.log("OK, inside bookmarks title GET")
    let foundTitles = [];

    //Assign the title's query name to variable
    let titleQuery = req.query.title;

    //Print the query's title that Postman is sending
    //console.log(titleQuery);

    //Verify that the user has actually inserted a value into the query, otherwise
    //send a 406, unaceptable request
    if(titleQuery === '')
    {   
        res.statusMessage = "Cannot accept an empty title string"
        return res.status(406).end();
    }

    //Check the entire array for fully matching titles with query
    for(let i=0; i < post.length; i++)
    {
        //Check to see if the query is in the title of the JSON
        if(titleQuery === post[i].title){
            foundTitles.push(post[i]);
        }
    }

    //Stop the execution if nothing was found
    if(!foundTitles.length)
    {
        res.statusMessage = "No results found in the database"
        return res.status(404).end();
    }

    //Finish execution and return the found bookmark items
    return res.status(200).json({foundTitles});

});

//Endpoint to return all bookmarks available GET
bookMApp.get('/bookmarks',(req, res)=>{
    return res.status(200).json({post});
});

//Initialize server
bookMApp.listen(8080, () =>{
    console.log("Server is running on port 8080");
});
