import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types/index'
import { developmetChains, networkConfig } from '../helper-hardhat-config'
import 'dotenv/config'
import { verify } from '../utils/verify'
import { VRFCoordinatorV2Mock } from '../typechain-types/@chainlink/contracts/src/v0.8/mocks'
import { storeImages, storeTokenURIMetaData } from '../utils/uploadToPinata'

export interface MetaDataTemplate {
    name: string
    description: string
    image: string
    attributes: {
        trait_type: string
        value: number
    }[]
}

const dogTokenURIs = [
    'ipfs://QmbfbVh7x3qYnRvLvKrGuaE1wv23PRTHMihet2nN7Lkyxy',
    'ipfs://QmRLAHuaSpPgW8qbV7cMFoUeWdNvT8N4uPmZ1QguAU4zNP',
    'ipfs://QmPULjS9vpc8iDVjy6BvC2fFhoMBWUEC3GUCH21EjeZW8f',
]

const imagesLocation = './images/randomNFTs'

const func: DeployFunction = async ({
    network,
    getNamedAccounts,
    deployments,
    ethers,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther('10')
    const chainId = network.config.chainId as number

    //get the ipfs hashes
    const tokenUris = dogTokenURIs.length
        ? dogTokenURIs
        : await handleTokenURIs()

    let vrfCoordinatorV2Address: string
    let subscriptionId: string

    if (developmetChains.includes(network.name)) {
        const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
            await ethers.getContract('VRFCoordinatorV2Mock')
        vrfCoordinatorV2Address = VRFCoordinatorV2Mock.address
        const tx = await VRFCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await tx.wait(1)
        const events = transactionReceipt.events!
        subscriptionId = events[0].args?.subId!
        await VRFCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        )
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinator!
        subscriptionId = networkConfig[chainId].subId
    }

    log('---------------------------------')
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNFT = await deploy('RandomIpfsNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: chainId === 31337 ? 1 : 6,
    })

    log('---------------------------------')

    if (!developmetChains.includes(network.name) && process.env.API_KEY) {
        log('Verifying............')
        await verify(randomIpfsNFT.address, args)
        log('---------------------------------')
    } else {
        const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock =
            await ethers.getContract('VRFCoordinatorV2Mock')

        await VRFCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIpfsNFT.address
        )
    }
}

const handleTokenURIs = async () => {
    const tokenUris: string[] = []

    //store the imgae ins ipfs
    //store the metadat in ipfs
    const { responses, files } = await storeImages(imagesLocation)

    for (let i in responses) {
        const tokenURIMetaData: MetaDataTemplate = {
            name: files[i].replace('.png', ''),
            image: `ipfs://${responses[i].IpfsHash}`,
            description: '',
            attributes: [
                {
                    trait_type: 'cuteness',
                    value: 100,
                },
            ],
        }
        tokenURIMetaData.description = `An adorable ${tokenURIMetaData.name} pup!`

        console.log('Uploading JSON......')
        const metadataUploadRes = await storeTokenURIMetaData(tokenURIMetaData)
        if (metadataUploadRes) {
            tokenUris.push(`ipfs://${metadataUploadRes.IpfsHash}`)
        }
    }

    console.log('Token URIs uploaded:\n', tokenUris)
    return tokenUris
}

export default func
func.tags = ['all', 'ipfs', 'main']
