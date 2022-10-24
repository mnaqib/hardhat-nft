import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types/index'
import { developmetChains, networkConfig } from '../helper-hardhat-config'
import 'dotenv/config'
import { verify } from '../utils/verify'
import { MockV3Aggregator } from '../typechain-types'
import { ethers } from 'hardhat'
import fs from 'fs'

const func: DeployFunction = async ({
    network,
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId as number

    let ethUSDPriceFeed: string

    if (developmetChains.includes(network.name)) {
        const EthUsd: MockV3Aggregator = await ethers.getContract(
            'MockV3Aggregator'
        )
        ethUSDPriceFeed = EthUsd.address
    } else {
        ethUSDPriceFeed = networkConfig[chainId].ethUSDPriceFeed!
    }

    const lowSVG = fs.readFileSync('./images/dynamicNFTs/frown.svg', 'utf-8')
    const highSVG = fs.readFileSync('./images/dynamicNFTs/happy.svg', 'utf-8')

    log('---------------------------------')
    const args = [lowSVG, highSVG, ethUSDPriceFeed]
    const DynamicSvgNFT = await deploy('DynamicSvgNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.chainId === 31337 ? 1 : 6,
    })

    if (!developmetChains.includes(network.name) && process.env.API_KEY) {
        log('Verifying............')
        await verify(DynamicSvgNFT.address, args)
        log('---------------------------------')
    }
}

export default func
func.tags = ['all', 'dynamic', 'main']
