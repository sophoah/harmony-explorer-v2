import {
  isHexString,
  isLength,
  isUint,
  isShardAvailable,
  CurryParamValidator,
  ParamValidator,
  isOneOf as isOneOfValidator,
} from './validators'
import {Filter, FilterEntry} from 'src/types'

export const isShard: CurryParamValidator = (value: number) => () => [
  isUint(value, {min: 0, max: 3}),
  isShardAvailable(value),
]
export const isBlockNumber: CurryParamValidator = (value: number) => () => isUint(value, {min: 0})

export const isBlockHash: CurryParamValidator = (value: string) => () => [
  isHexString(value),
  isLength(value, {min: 66, max: 66}),
]

export const isTransactionHash: CurryParamValidator = (value: string) => () => [
  isHexString(value),
  isLength(value, {min: 66, max: 66}),
]

export const isAddress: CurryParamValidator = (value: string) => () => [
  isHexString(value),
  isLength(value, {min: 42, max: 42}),
]

export const isOffset: CurryParamValidator = (value: number) => () => isUint(value, {min: 0})
export const isLimit: CurryParamValidator = (value: number) => () =>
  isUint(value, {min: 0, max: 100})

export const isOneOf: CurryParamValidator = (value: number, params: String[]) => () =>
  isOneOfValidator(value, params)

export const isOrderDirection: CurryParamValidator = (value: number) => () =>
  isOneOfValidator(value, ['asc', 'desc'])

export const isOrderBy: CurryParamValidator = (value: number) => () =>
  isOneOfValidator(value, ['number', 'timestamp'])

// todo check FilterEntry value
export const isFilters: CurryParamValidator = (value: FilterEntry[]) => () => {
  return value
    .map((f) => [
      isOneOfValidator(f.property, ['number', 'timestamp']),
      isOneOfValidator(f.type, ['gt', 'gte', 'lt', 'lte']),
    ])
    .flatMap((f) => f)
}

export const Void: ParamValidator = () => {}
