import {IStorageAddress} from 'src/store/interface'
import {Address2Transaction, Block, Filter, AddressTransactionType} from 'src/types'
import {Query} from 'src/store/postgres/types'
import {fromSnakeToCamelResponse, generateQuery} from 'src/store/postgres/queryMapper'
import {buildSQLQuery} from 'src/store/postgres/filters'

export class PostgresStorageAddress implements IStorageAddress {
  query: Query

  constructor(query: Query) {
    this.query = query
  }

  addAddress2Transaction = async (entry: Address2Transaction) => {
    const {query, params} = generateQuery(entry)
    return await this.query(
      `insert into address2transaction ${query} on conflict (address, transaction_hash, transaction_type) do nothing;`,
      params
    )
  }

  // todo warning depricated
  getRelatedTransactions = async (filter: Filter): Promise<Address2Transaction[]> => {
    // todo hack
    const q = buildSQLQuery(filter)
      .replace('address', 'address2transaction.address')
      .split('block_number')
      .join(' address2transaction.block_number')

    // todo staking txs are not returned!!!
    const res = await this.query(
      `
    select * from (select * from address2transaction ${q}) as a 
    left join staking_transactions on 
    (a.transaction_hash = staking_transactions.hash and a.transaction_type='staking_transaction')
    left join transactions on (a.transaction_hash = transactions.hash and a.transaction_type<>'staking_transaction')
        `,
      []
    )

    return res.map(fromSnakeToCamelResponse)
  }

  getRelatedTransactionsByType = async (
    filter: Filter,
    type: AddressTransactionType
  ): Promise<Address2Transaction[]> => {
    filter.filters.push({
      value: `'${type}'`,
      type: 'eq',
      property: 'transaction_type',
    })

    const q = buildSQLQuery(filter)
    // hack fresh transactions recorded last, not need sort
    // .replace('order by block_number desc', '')

    if (type === 'staking_transaction') {
      const res = await this.query(
        `
    select * from (select * from address2transaction ${q}) as a 
    left join staking_transactions on a.transaction_hash = staking_transactions.hash
        `,
        []
      )

      return res.map(fromSnakeToCamelResponse)
    }

    const res = await this.query(
      `
    select * from (select * from address2transaction ${q}) as a 
    left join transactions on a.transaction_hash = transactions.hash
        `,
      []
    )

    return res.map(fromSnakeToCamelResponse)
  }
}
