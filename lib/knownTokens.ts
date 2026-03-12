export interface KnownToken {
  address: `0x${string}`
  symbol: string
  name: string
  coinId: string
  decimals: number
}

// Ethereum mainnet tokens
export const ETHEREUM_TOKENS: KnownToken[] = [
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin', decimals: 6 },
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether', coinId: 'tether', decimals: 6 },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', coinId: 'wrapped-bitcoin', decimals: 8 },
  { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', coinId: 'weth', decimals: 18 },
  { address: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai', coinId: 'dai', decimals: 18 },
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', coinId: 'uniswap', decimals: 18 },
  { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', coinId: 'chainlink', decimals: 18 },
  { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave', coinId: 'aave', decimals: 18 },
  { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', symbol: 'stETH', name: 'Lido Staked ETH', coinId: 'staked-ether', decimals: 18 },
  { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', symbol: 'CRV', name: 'Curve DAO', coinId: 'curve-dao-token', decimals: 18 },
  { address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', symbol: 'MKR', name: 'Maker', coinId: 'maker', decimals: 18 },
  { address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', symbol: 'SNX', name: 'Synthetix', coinId: 'havven', decimals: 18 },
  { address: '0xba100000625a3754423978a60c9317c58a424e3d', symbol: 'BAL', name: 'Balancer', coinId: 'balancer', decimals: 18 },
  { address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', symbol: 'YFI', name: 'yearn.finance', coinId: 'yearn-finance', decimals: 18 },
  { address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', symbol: 'HEX', name: 'HEX', coinId: 'hex', decimals: 8 },
  // Meme coins — Ethereum
  { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', symbol: 'SHIB', name: 'Shiba Inu', coinId: 'shiba-inu', decimals: 18 },
  { address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', symbol: 'PEPE', name: 'Pepe', coinId: 'pepe', decimals: 18 },
  { address: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e', symbol: 'FLOKI', name: 'FLOKI', coinId: 'floki', decimals: 9 },
  { address: '0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3', symbol: 'ELON', name: 'Dogelon Mars', coinId: 'dogelon-mars', decimals: 18 },
  { address: '0x4d224452801aced8b2f0aebe155379bb5d594381', symbol: 'APE', name: 'ApeCoin', coinId: 'apecoin', decimals: 18 },
  { address: '0xb131f4a55907b10d1f0a50d8ab8fa09ec342cd74', symbol: 'MEME', name: 'Memecoin', coinId: 'memecoin-2', decimals: 18 },
  { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', symbol: 'MATIC', name: 'Polygon', coinId: 'matic-network', decimals: 18 },
  { address: '0x1abaea1f7c830bd89acc67ec4af516284b1bc33c', symbol: 'EURC', name: 'Euro Coin', coinId: 'euro-coin', decimals: 6 },
]

// Base chain tokens
export const BASE_TOKENS: KnownToken[] = [
  { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', symbol: 'USDC', name: 'USD Coin', coinId: 'usd-coin', decimals: 6 },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', coinId: 'weth', decimals: 18 },
  { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', symbol: 'DAI', name: 'Dai', coinId: 'dai', decimals: 18 },
  { address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', symbol: 'USDbC', name: 'Bridged USDC', coinId: 'usd-coin', decimals: 6 },
  { address: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', coinId: 'coinbase-wrapped-staked-eth', decimals: 18 },
  // Base meme coins
  { address: '0x532f27101965dd16442e59d40670faf5ebb142e4', symbol: 'BRETT', name: 'Brett', coinId: 'brett', decimals: 18 },
  { address: '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4', symbol: 'TOSHI', name: 'Toshi', coinId: 'toshi', decimals: 18 },
  { address: '0x0d97f261b1e88845184f678e2d1e7a98d9fd38de', symbol: 'HIGHER', name: 'Higher', coinId: 'higher', decimals: 18 },
  { address: '0xb1a03eda10342529bbf8eb700a06c60441fef25d', symbol: 'MIGGLES', name: 'Miggles', coinId: 'miggles', decimals: 18 },
  { address: '0x768be13e1680b5ebe0024c42c896e3db59ec0149', symbol: 'SKI', name: 'Ski Mask Dog', coinId: 'ski-mask-dog', decimals: 18 },
  { address: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452', symbol: 'wstETH', name: 'Wrapped stETH', coinId: 'wrapped-steth', decimals: 18 },
  { address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', coinId: 'coinbase-wrapped-btc', decimals: 8 },
]

export const ALL_KNOWN_TOKENS = [...ETHEREUM_TOKENS, ...BASE_TOKENS]
