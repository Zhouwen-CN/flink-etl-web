export interface DictionaryData {
  label: string
  value: number
}

export type DictionaryResponseData = ApiResponseData<DictionaryData[]>
