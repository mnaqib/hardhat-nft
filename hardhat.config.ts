import { HardhatUserConfig } from 'hardhat/types'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import 'dotenv/config'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const API_KEY = process.env.API_KEY as string
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY as string
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
        localhost: {
            url: 'http://127.0.0.1:8545/',
            chainId: 31337,
        },
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
    },
    solidity: {
        compilers: [
            { version: '0.8.7' },
            { version: '0.4.19' },
            { version: '0.6.12' },
            { version: '0.6.6' },
            { version: '0.6.0' },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        // Your API key for Etherscan
        apiKey: API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: 'gas-report.txt',
        noColors: true,
        currency: 'USD',
        coinmarketcap: COINMARKETCAP_KEY,
        token: 'ETH',
    },
    mocha: {
        timeout: 600000, // 600 seconds
    },
}

export default config
