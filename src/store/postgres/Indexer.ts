import {logger} from 'src/logger'
import {IStorageIndexer} from 'src/store/interface'
import {BlockNumber, ShardID} from 'src/types/blockchain'

import {Query} from 'src/store/postgres/types'

const l = logger(module)

export class PostgresStorageIndexer implements IStorageIndexer {
  query: Query
  constructor(query: Query) {
    this.query = query
  }

  getChainID = async (): Promise<number> => {
    const res = await this.query(`select chain_id from indexer_state where id=0;`, [])
    const lastIndexedBlock = +res[0][`chain_id`]
    return lastIndexedBlock || 0
  }

  getLastIndexedBlockNumber = async (): Promise<number | null> => {
    const res = await this.query(
      `select blocks_last_synced_block_number from indexer_state where id=0;`,
      []
    )
    const lastIndexedBlock = +res[0][`blocks_last_synced_block_number`]
    return lastIndexedBlock || 0
  }

  setLastIndexedBlockNumber = async (num: BlockNumber): Promise<number> => {
    return this.query(`update indexer_state set blocks_last_synced_block_number=$1 where id=0;`, [
      num,
    ])
  }

  getLastIndexedLogsBlockNumber = async (): Promise<number> => {
    const res = await this.query(
      `select logs_last_synced_block_number from indexer_state where id=0;`,
      []
    )

    const lastIndexedBlock = +res[0][`logs_last_synced_block_number`]
    return lastIndexedBlock || 0
  }

  setLastIndexedLogsBlockNumber = async (num: BlockNumber): Promise<number> => {
    return this.query(`update indexer_state set logs_last_synced_block_number=$1 where id=0;`, [
      num,
    ])
  }
}
