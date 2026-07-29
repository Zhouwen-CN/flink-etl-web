/**
 * Monaco 编辑器一次性初始化模块
 * 作为 Editor/index.vue 的副作用导入，仅在该组件被使用时加载
 * 模块缓存保证下面的初始化只执行一次
 */
import * as monaco from "monaco-editor"
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import { configureMonacoYaml } from "monaco-yaml"
import YamlWorker from "monaco-yaml/yaml.worker?worker"

/**
 * 配置 Monaco 的 Web Worker
 * Monaco 把语法分析、补全等重活放到独立 worker 线程，避免阻塞主线程
 * getWorker 按 language label 路由到对应 worker：json / yaml 用各自语言服务，其余走通用 editor worker
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === "json") return new JsonWorker()
    if (label === "yaml") return new YamlWorker()
    return new EditorWorker()
  }
}

// JSON 语言服务 schema 注册
// fileMatch: * —— 所有 json 文件都应用此 schema（组件内编辑器默认 uri 匹配）
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  enableSchemaRequest: true,
  allowComments: false,
  schemas: [
    {
      uri: import.meta.env.VITE_CONFIG_SCHEMA_URL,
      fileMatch: ["*"]
    }
  ]
})

// YAML 语言服务 schema 注册
// monaco-yaml 复用同一份 JSON schema 做补全/校验
configureMonacoYaml(monaco, {
  validate: true,
  enableSchemaRequest: true,
  schemas: [
    {
      uri: import.meta.env.VITE_CONFIG_SCHEMA_URL,
      fileMatch: ["*"]
    }
  ]
})

export { monaco }
