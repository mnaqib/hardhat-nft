import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmetChains } from '../helper-hardhat-config'
import {
    BasicNFT,
    DynamicSvgNFT,
    RandomIpfsNFT,
    VRFCoordinatorV2Mock,
} from '../typechain-types'

const func: DeployFunction = async ({
    network,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts()

    //Basic NFT
    const basicNFT: BasicNFT = await ethers.getContract('BasicNFT', deployer)
    const basicTx = await basicNFT.mintNFT()
    await basicTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNFT.tokenURI(0)}`)

    //random ipfs NFT
    const randomIpfsNFT: RandomIpfsNFT = await ethers.getContract(
        'RandomIpfsNFT',
        deployer
    )
    const mintFee = await randomIpfsNFT.getMintFee()

    await new Promise<void>(async (resolve, reject) => {
        setTimeout(resolve, 30000)

        try {
            randomIpfsNFT.once('NFTMinted', async () => {
                resolve()
            })

            const ipfsTx = await randomIpfsNFT.requestNFT({ value: mintFee })
            const events = (await ipfsTx.wait(1)).events!

            if (developmetChains.includes(network.name)) {
                const requestId = events[1].args?.requestId
                const vrf: VRFCoordinatorV2Mock = await ethers.getContract(
                    'VRFCoordinatorV2Mock'
                )
                await vrf.fulfillRandomWords(requestId, randomIpfsNFT.address)
            }
        } catch (error) {
            console.error(error)
            reject(error)
        }
    })

    console.log(
        `Random IPFS NFT indfex 0 tokenURI: ${await randomIpfsNFT.tokenURI(0)}`
    )

    //Dynamic NFT
    const highValue = ethers.utils.parseEther('1000')
    const dynamicSvgNFT: DynamicSvgNFT = await ethers.getContract(
        'DynamicSvgNFT',
        deployer
    )
    const dynamicTx = await dynamicSvgNFT.mintNFT(highValue)
    await dynamicTx.wait(1)
    console.log(
        `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNFT.tokenURI(0)}`
    )
}

export default func
func.tags = ['all', 'mint']
