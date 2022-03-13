// export async function handler(event: Structu): Pro {}
exports.handler = async (event:any) => {
    console.log('event:', event);
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify('HELLOOOO')
    };
}