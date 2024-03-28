import { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    console.log('Incoming request!');
    return new Response('Hello, world!');
}