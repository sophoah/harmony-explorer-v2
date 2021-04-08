import nodeFetch from 'node-fetch'
import {RPCETHMethod, RPCHarmonyMethod} from 'types/blockchain'
import AbortController from 'abort-controller'
import {logger} from 'src/logger'
import {config} from 'src/indexer/config'
import {RPCUrls} from './RPCUrls'
import {ShardID} from 'src/types/blockchain'

const l = logger(module)

const defaultFetchTimeout = 10000
const defaultRetries = 5
const RPCErrorPrefix = 'RPC Error'
const increaseTimeout = (retry: number) => defaultFetchTimeout

export const fetch = async (
  shardID: ShardID,
  method: RPCETHMethod | RPCHarmonyMethod,
  params: any[]
): Promise<any> => {
  const exec = async (
    shardID: ShardID,
    method: RPCETHMethod | RPCHarmonyMethod,
    params: any[],
    retry = defaultRetries
  ): Promise<any> => {
    try {
      return await fetchWithoutRetry(shardID, method, params, increaseTimeout(retry))
    } catch (err) {
      const isRCPErrorResponse = err.message.indexOf(RPCErrorPrefix) !== -1

      const retriesLeft = retry - 1
      if (retriesLeft < 1 || isRCPErrorResponse) {
        throw new Error(err)
      }

      l.debug(`Retrying... ${retriesLeft}/${defaultRetries}`)
      return exec(shardID, method, params, retriesLeft)
    }
  }

  return exec(shardID, method, params, defaultRetries)
}

export const fetchWithoutRetry = (
  shardID: ShardID,
  method: RPCETHMethod | RPCHarmonyMethod,
  params: any[],
  timeout = defaultFetchTimeout
) => {
  const startDate = Date.now()
  const rpc = RPCUrls.getURL(shardID)

  const body = {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  }
  l.debug(`fetch ${rpc.url} "${method}"`, {params})

  const controller = new AbortController()
  const timeoutID = setTimeout(() => {
    controller.abort()
  }, timeout)

  const payload = {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'},
    signal: controller.signal,
  }

  return nodeFetch(rpc.url, payload)
    .then((res) => res.json())
    .then((res) => {
      if (res.result) {
        return res.result
      }
      if (res.error) {
        throw new Error(RPCErrorPrefix + ': ' + JSON.stringify(res.error))
      }
      throw new Error('No response data')
    })
    .then((result) => {
      rpc.submitStatistic(Date.now() - startDate, false)
      return result
    })
    .catch((err) => {
      rpc.submitStatistic(defaultFetchTimeout, true)
      l.warn(`Failed to fetch ${rpc.url} ${method}`, {
        err: err.message || err,
        params,
      })

      throw new Error(err)
    })
    .finally(() => {
      l.debug(`fetch ${rpc.url} "${method}" took ${Date.now() - startDate}ms`)
      clearTimeout(timeoutID)
    })
}
