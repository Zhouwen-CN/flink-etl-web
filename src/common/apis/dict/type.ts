export interface DictionaryData {
  label: string
  value: number | string
}

export type DictionaryResponseData = ApiResponseData<DictionaryData[]>
