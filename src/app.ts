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

    if(resolve(DEST_DIR)){
        rmSync(DEST_DIR,{recursive: true})
    }

    await mkdirSync(DEST_DIR)
    const files = await readdirSync(resolve(SRC_DIR))
    console.log("\n")
    files.map(e => {
        const filename = e.split('.')[0]
        const ws = createWriteStream(`${DEST_DIR}/${e}`)
        const csvFile = createReadStream(resolve(`${SRC_DIR}/${e}`))

        csvFile.setEncoding('utf8')
        csvFile.pipe(csv.parse({
            headers: false,
            maxRows: 1,
            trim: true
        })).on('data', row =>  ws.write(row.toString()))

        ws.on('open',()=>{
            console.log(`${emoj.get('🕐')} Analyzing ${filename} csv...`)
        })
        csvFile.on('close',()=>{
            console.log(`${emoj.get('✅')} Processing ${filename} csv to table complete`)
        })
    })

}

const getAnswers = async (input?:any) => {

    await readandInitCSV()

    let files = readdirSync(DEST_DIR)

    const messageInput = input
    let promptText = `${messageInput}\n\n`

    for(var i = 0; i < files.length; i++){

        let capFilename = files[i].charAt(0).toUpperCase() + files[i].slice(1)
        promptText += `\nTable:${capFilename.split('.')[0]} Columns:[${readFileSync(`${DEST_DIR}/${files[i]}`).toString()}]`

    }

    const opai = new OpenAIApi(config)
    const req = await opai.createCompletion({
        model: OPEN_AI_MODEL,
        prompt: promptText.concat(" ,with a witty closing message after the query"),
        max_tokens: 128,
        temperature: 0.2
    })

    return req.data.choices[0].text

}

const run = async (msg:String) => {
    try {
        const res = await getAnswers(msg.toString())
        console.log(`\n=======\n\nSQL Query: ${res}\n=======`)
    }
    catch(err){
        console.log(err)
    }
}

const rl = readline.createInterface({input,output})
const answer = rl.question(`${emoj.get('👨🏾‍💻')} Tell me how I should write this query? `).then(e => {
    run(e).then(response => {
        console.log(`${emoj.get('😉')} Done!`)
        rl.close()
    })
});
