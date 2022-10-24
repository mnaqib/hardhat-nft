import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types/index'
import { developmetChains } from '../helper-hardhat-config'
import 'dotenv/config'
import { verify } from '../utils/verify'

const func: DeployFunction = async ({
    network,
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log('---------------------------------')
    const args: any = []
    const basicNFT = await deploy('BasicNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.chainId === 31337 ? 1 : 6,
    })

    if (!developmetChains.includes(network.name) && process.env.API_KEY) {
        log('Verifying............')
        await verify(basicNFT.address, args)
        log('---------------------------------')
    }
}

export default func
func.tags = ['all', 'basic', 'main']
