import assert from 'node:assert/strict'
import { listarProdutos, salvarRelatorio } from './api.js'

let token = 'sessao-a'
globalThis.window = { localStorage: { getItem: () => token } }
let chamadas = 0
let liberar
globalThis.fetch = () => {
  chamadas += 1
  return new Promise(resolve => { liberar = () => resolve({ ok: true, status: 200, json: async () => [] }) })
}

const primeira = listarProdutos()
const simultanea = listarProdutos()
assert.equal(chamadas, 1, 'Leituras simultâneas da mesma sessão compartilham uma requisição')
liberar()
await Promise.all([primeira, simultanea])
const posterior = listarProdutos()
assert.equal(chamadas, 2, 'Nova consulta após conclusão deve atualizar os dados')
liberar()
await posterior

const sessaoA = listarProdutos()
const liberarA = liberar
token = 'sessao-b'
const sessaoB = listarProdutos()
assert.equal(chamadas, 4, 'Sessões diferentes não compartilham respostas')
liberarA()
liberar()
await Promise.all([sessaoA, sessaoB])

globalThis.fetch = async () => { chamadas += 1; return { ok: true, status: 201, json: async () => ({ id: chamadas }) } }
await Promise.all([salvarRelatorio({}), salvarRelatorio({})])
assert.equal(chamadas, 6, 'Gravações nunca devem ser agrupadas')
console.log('API: 4 verificações aprovadas (leituras simultâneas, atualização, isolamento de sessão e gravações).')
