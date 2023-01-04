import * as dotenv from 'dotenv'
dotenv.config()

import { Configuration, OpenAIApi } from 'openai'
import { createReadStream, createWriteStream, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'path'
import * as csv from 'fast-csv'
import * as emoj from 'node-emoji'

const DEST_DIR = 'final_docs'
const SRC_DIR = 'source'

const OPEN_AI_MODEL = 'text-davinci-003'

/**
 * Open AI
 */
const config = new Configuration({
    organization: process.env.ORG,
    apiKey: process.env.API_KEY
})


const readandInitCSV = async () => {

    try {
            // if the destination directory exists, remove it
            await mkdirSync(DEST_DIR,{recursive: true})
            const files = await readdirSync(resolve(SRC_DIR))

            files.map(e => {

                if(e != '.DS_Store'){
                // create the filename
                const filename = e.split('.')[0]

                // create write/read streams
                const ws = createWriteStream(`${DEST_DIR}/${e}`)
                const csvFile = createReadStream(resolve(`${SRC_DIR}/${e}`))

                // Read csv files, write top row columns to new files
                csvFile.setEncoding('utf8')
                csvFile.pipe(csv.parse({
                    headers: false,
                    maxRows: 1,
                    trim: true
                })).on('data', row =>  ws.write(row.toString()))

                ws.on('open',(e)=>{

                    console.log(`${emoj.get('🕐')} Analyzing ${filename} csv...`)
                })
                csvFile.on('close',()=>{
                    console.log(`${emoj.get('✅')} Processing ${filename} csv to table complete`)
                })
                }
            })



    }
    catch(error){
        console.log(error)
    }

    // make destination directory


}

const getAnswers = async (input?:any) => {

    try {
        await readandInitCSV()

        // get files from destination director
        let files = await readdirSync(resolve(DEST_DIR))

        // assign user input to prompt variable
        const messageInput = input
        var promptText = `Reference tables and columns below: ${messageInput}\n\n`

        for(var i = 0; i < files.length; i++){

            // Reformat filenames capitalize/concatenate and append to prompt text
            // Read column values from files
            if(files[i] != '.DS_Store'){
                var capFilename = files[i].charAt(0).toUpperCase() + files[i].slice(1)
                promptText += `\nTable:${capFilename.split('.')[0]} Columns:[${readFileSync(`${DEST_DIR}/${files[i].toString()}`).toString('utf8')}]`
            }


        }

        // Pass promptText variable to createCompletion `prompt` option
        const opai = new OpenAIApi(config)
        const req = await opai.createCompletion({
            model: OPEN_AI_MODEL,
            prompt: promptText.concat(" ,with a witty closing message after the query"),
            max_tokens: 128,
            temperature: 0.2
        })


        return req.data.choices[0].text
    }
    catch(error) {

    }

}

const run = async (msg:String) => {
    try {
        console.log("\n")
        const res = await getAnswers(msg.toString())
        console.log(`\n=======\n\nSQL Query: ${res}\n=======`)
    }
    catch(err){
        console.log(err)
    }
}

// create cli user input interface
const rl = readline.createInterface({input,output})
const answer = rl.question(`${emoj.get('👨🏾‍💻')} Tell me how I should write this query? \n`).then(e => {
    run(e).then(response => {
        console.log(`${emoj.get('😉')} Done!`)
        rl.close()
    })
});
