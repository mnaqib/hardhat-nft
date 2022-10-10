import { network, ethers, getNamedAccounts, deployments } from 'hardhat'
import { developmetChains } from '../../helper-hardhat-config'
import { RandomIpfsNFT, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert, expect } from 'chai'
import { BigNumber } from 'ethers'

!developmetChains.includes(network.name)
    ? describe.skip
    : describe('randomIpfsNFT', () => {
          let deployer: string
          let randomIpfsNFT: RandomIpfsNFT
          let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock
          let NFTMintFee: BigNumber

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(['ipfs', 'mock'])
              randomIpfsNFT = await ethers.getContract(
                  'RandomIpfsNFT',
                  deployer
              )
              VRFCoordinatorV2Mock = await ethers.getContract(
                  'VRFCoordinatorV2Mock'
              )
              NFTMintFee = await randomIpfsNFT.getMintFee()
          })

          describe('constructor', () => {
              it('initialize the ipfs NFT correctly', async () => {
                  const dogTokenURI0 = await randomIpfsNFT.getDogTokenUris(0)
                  assert(dogTokenURI0.includes('ipfs://'))
              })
          })

          describe('requestNFT', () => {
              it('fails if payment is not sent with request', async () => {
                  await expect(
                      randomIpfsNFT.requestNFT()
                  ).to.be.revertedWithCustomError(
                      randomIpfsNFT,
                      'RIN__NeedMoreETHSent'
                  )
              })

              it('fails if payment is less than mint fee', async () => {
                  const mintFee = await randomIpfsNFT.getMintFee()
                  await expect(
                      randomIpfsNFT.requestNFT({
                          value: mintFee.sub(ethers.utils.parseEther('0.001')),
                      })
                  ).to.be.revertedWithCustomError(
                      randomIpfsNFT,
                      'RIN__NeedMoreETHSent'
                  )
              })

              it('emits an event and kicks off a random word request', async () => {
                  await expect(
                      randomIpfsNFT.requestNFT({
                          value: NFTMintFee,
                      })
                  ).to.emit(randomIpfsNFT, 'NFTRequested')
              })
          })

          describe('fulfill random words', () => {
              it('mints NFT after random number is returned', async () => {
                  await new Promise<void>(async (resolve, reject) => {
                      randomIpfsNFT.once('NFTMinted', async () => {
                          try {
                              const tokenCounter =
                                  await randomIpfsNFT.getTokenCounter()
                              const tokenURI = await randomIpfsNFT.tokenURI('0')

                              assert(tokenURI.includes('ipfs://'))
                              assert.equal(tokenCounter.toString(), '1')
                              resolve()
                          } catch (e) {
                              console.error(e)
                              reject(e)
                          }
                      })

                      try {
                          const tx = await randomIpfsNFT.requestNFT({
                              value: NFTMintFee,
                          })
                          const events = (await tx.wait(1)).events!
                          const requestId = events[1].args?.requestId
                          VRFCoordinatorV2Mock.fulfillRandomWords(
                              requestId,
                              randomIpfsNFT.address
                          )
                      } catch (e) {
                          console.error(e)
                          reject(e)
                      }
                  })
              })
          })

          describe('getBreedFromModdedRng', () => {
              it('should return pug if moddedRng < 10', async () => {
                  const expectedValue =
                      await randomIpfsNFT.getBreedFromModdedRNG(7)
                  assert.equal(0, expectedValue)
              })
              it('should return shiba-inu if moddedRng is between 10 - 39', async () => {
                  const expectedValue =
                      await randomIpfsNFT.getBreedFromModdedRNG(21)
                  assert.equal(1, expectedValue)
              })
              it('should return st. bernard if moddedRng is between 40 - 99', async () => {
                  const expectedValue =
                      await randomIpfsNFT.getBreedFromModdedRNG(77)
                  assert.equal(2, expectedValue)
              })
              it('should revert if moddedRng > 99', async () => {
                  await expect(
                      randomIpfsNFT.getBreedFromModdedRNG(100)
                  ).to.be.revertedWithCustomError(
                      randomIpfsNFT,
                      'RIN__RangeOutOfBounds'
                  )
              })
          })
      })
