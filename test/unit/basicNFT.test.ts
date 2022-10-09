import { network, getNamedAccounts, ethers, deployments } from 'hardhat'
import { assert, expect } from 'chai'

const { getSigners, getSigner } = ethers

import { developmetChains } from '../../helper-hardhat-config'
import { BasicNFT } from '../../typechain-types'

type SignerWithAddress = Awaited<ReturnType<typeof getSigner>>

!developmetChains.includes(network.name)
    ? describe.skip
    : describe('BasicNFT', () => {
          let deployer: string
          let basicNFT: BasicNFT
          let accounts: SignerWithAddress[]

          beforeEach(async () => {
              await deployments.fixture(['basic'])
              deployer = (await getNamedAccounts()).deployer
              basicNFT = await ethers.getContract('BasicNFT', deployer)
              accounts = await getSigners()
          })

          describe('Constructor', () => {
              it('initialize the basic NFT correctly', async () => {
                  const tokenCounter = await basicNFT.getTokenCounter()
                  const name = await basicNFT.name()
                  const symbol = await basicNFT.symbol()

                  assert.equal(tokenCounter.toString(), '0')
                  assert.equal(name, 'Dogie')
                  assert.equal(symbol, 'Dog')
              })
          })

          describe('mint NFT', () => {
              beforeEach(async () => {
                  const tx = basicNFT.mintNFT()
                  await (await tx).wait(1)
              })

              it('Allows users to mint an NFt and updates correctly', async () => {
                  const tokenURI = await basicNFT.tokenURI(0)
                  const tokenCounter = await basicNFT.getTokenCounter()

                  assert.equal(tokenCounter.toString(), '1')
                  assert.equal(tokenURI, await basicNFT.TOKEN_URI())
              })

              it('Show the correct balance and owner of an NFT', async () => {
                  const balance = await basicNFT.balanceOf(deployer)
                  const owner = await basicNFT.ownerOf('0')

                  assert.equal(balance.toString(), '1')
                  assert.equal(owner, deployer)
              })
          })
      })
