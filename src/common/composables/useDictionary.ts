import type { DictionaryData, DictionaryResponseData } from "@/common/apis/dict/type"

function useDictionary(func: (...args: any[]) => Promise<DictionaryResponseData>) {
  const dictData = ref<DictionaryData[]>([])
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
