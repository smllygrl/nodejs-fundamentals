const db = require("./db");

const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb");

const getPost = async (event) => {
    // Below is the response form a Lambda function, not the end point
    // The body is what is returns from the endpoint
    const response = { statusCode: 200 };

    try {

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            // We're going to be passing a JSON object, it needs to be converted into a DynamoDB record
            // so that it can be recognised as a proper key
            Key: marshall({ postId: event.pathParameters.postId }),
        };

        const { Item } = await db.send( new GetItemCommand(params));

        console.log({Item});

        response.body = JSON.stringify({
            message: "Successfully retirved post.",
            // ifthe Item is undefined, unmarshall the response
            data: (Item) ? unmarshall(Item) : {},
            rawData: Item,
        });

    } catch (e) {

        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to post.",
            errorMsg: e.meessage,
            errorStack: e.stack,
        });

    }

    return response;

}

const createPost = async (event) => {

    const response = { statusCode: 200 };

    try {

        const body = JSON.parse(event.body);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall( body || {} ),
        };

        const createResult = await db.send( new PutItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully created post.",
            createResult,
        });

    } catch (e) {

        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed create post.",
            errorMsg: e.meessage,
            errorStack: e.stack,
        });

    }

    return response;

}

const updatePost = async (event) => {

    const response = { statusCode: 200 };

    try {

        const body = JSON.parse(event.body);

        const objKeys = Object.keys(body);

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ postId: event.pathParameters.postId }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :values${index}`).join(", ")}`,
            ExppressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:values${index}`]: key,
            }), {}))
        };

        const updateResult = await db.send( new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated post.",
            updateResult,
        });

    } catch (e) {

        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed update post.",
            errorMsg: e.meessage,
            errorStack: e.stack,
        });

    }

    return response;

}

const deletePost = async (event) => {

    const response = { statusCode: 200 };

    try {

        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ postId: event.pathParameters.postId }),
        };

        const deleteResult = await db.send( new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted post.",
            deleteResult,
        });

    } catch (e) {

        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete post.",
            errorMsg: e.meessage,
            errorStack: e.stack,
        });

    }

    return response;

}

const getAllPosts = async (event) => {

    const response = { statusCode: 200 }; 

    try {

        const { Items } = await db.send( new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME })); 

        response.body = JSON.stringify({
            message: "Successfully retirved all posts.",
            data: Items.map((item) => unmarshall(item)),
            Items,
        });

    } catch (e) {

        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve posts.",
            errorMsg: e.meessage,
            errorStack: e.stack,
        });

    }

    return response;

}

module.exports = {
    getPost, createPost, updatePost, deletePost, getAllPosts,
}