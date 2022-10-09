import pinataSDK from '@pinata/sdk'
import path from 'path'
import fs from 'fs'
import 'dotenv/config'
import { MetaDataTemplate } from '../deploy/02-deploy-RandomIpfs'

const PINATA_API_KEY = process.env.PINATA_API_KEY || ''
const PINATA_SECERET_KEY = process.env.PINATA_SECERET_KEY || ''
const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECERET_KEY)
const { pinFileToIPFS, pinJSONToIPFS } = pinata

export type PinataPinResponse = Awaited<ReturnType<typeof pinFileToIPFS>>

export const storeImages = async (imagesFilePath: string) => {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(imagesFilePath)
    let responses: PinataPinResponse[] = []

    for (let fileIndex in files) {
        const fileStream = fs.createReadStream(
            path.join(fullImagesPath, files[fileIndex])
        )
        try {
            const res = await pinFileToIPFS(fileStream)
            responses.push(res)
        } catch (e) {
            console.error(e)
        }
    }

    return { responses, files }
}

export async function storeTokenURIMetaData(metadata: MetaDataTemplate) {
    try {
        const res = await pinJSONToIPFS(metadata, {
            pinataMetadata: { name: metadata.name },
        })
        return res
    } catch (e) {
        console.error(e)
    }
    return null
}
