export interface DictionaryRequestData {
  label: string
  value: number
}

function useDictionary(func: (...args: any[]) => Promise<ApiResponseData<DictionaryRequestData[]>>) {
  const dictData = ref<DictionaryRequestData[]>([])
  const dictMap = ref<Map<number, string>>(new Map<number, string>())

  function run(...args: any[]) {
    func(...args)
      .then((res) => {
        dictData.value = res.data || []
        res.data.forEach((item) => {
          dictMap.value.set(item.value, item.label)
        })
      })
  }

  return {
    dictData,
    dictMap,
    run
  }
}

export default useDictionary
