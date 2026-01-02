# ✅ CHECKLIST - IMPLEMENTAÇÃO FRONTEND

## 📋 ANTES DE COMEÇAR

- [ ] Abrir Replit
- [ ] Arquivo: `client/src/pages/contracts.tsx`
- [ ] Ter o guia aberto: `ATUALIZACAO_FRONTEND_CONTRATOS.md`
- [ ] Fazer backup: ✅ JÁ FEITO automaticamente

---

## 🔧 PASSO 1: SCHEMA (5 min)

**Linha ~50 - Encontrar `contractFormSchema`**

- [ ] Adicionar campo `tenantType`
- [ ] Adicionar campo `rentBaseValue`
- [ ] Adicionar campo `iptuValue`
- [ ] Adicionar campo `condominiumValue`
- [ ] Adicionar campo `iptuReimbursable`
- [ ] Adicionar campo `condominiumReimbursable`
- [ ] Adicionar campo `ivaIbsSubject`
- [ ] Adicionar campo `ivaIbsRate`
- [ ] Salvar (Ctrl+S)

---

## 🔧 PASSO 2: DEFAULT VALUES (5 min)

**Linha ~340 - Dentro de `defaultValues`**

- [ ] Adicionar valores padrão para todos os 8 campos
- [ ] Verificar sintaxe (vírgulas!)
- [ ] Salvar (Ctrl+S)

---

## 🔧 PASSO 3: CAMPO PF/PJ (5 min)

**Linha ~450 - Após campo `tenantPhone`**

- [ ] Adicionar FormField para `tenantType`
- [ ] Criar Select com opções PF/PJ
- [ ] Salvar (Ctrl+S)

---

## 🔧 PASSO 4: COMPOSIÇÃO ALUGUEL (15 min)

**Linha ~540 - Substituir seção de valores**

- [ ] Criar nova div com título "Composição do Aluguel"
- [ ] Adicionar campo `rentBaseValue`
- [ ] Adicionar campo `iptuValue` + checkbox
- [ ] Adicionar campo `condominiumValue` + checkbox
- [ ] Adicionar campo `rentValue` (calculado, readonly)
- [ ] Adicionar cálculo automático do total
- [ ] Manter campos `dueDay` e `status`
- [ ] Salvar (Ctrl+S)

---

## 🔧 PASSO 5: SEÇÃO IVA/IBS (5 min)

**Após seção de composição**

- [ ] Criar nova div "Reforma Tributária"
- [ ] Adicionar checkbox `ivaIbsSubject`
- [ ] Adicionar campo `ivaIbsRate`
- [ ] Salvar (Ctrl+S)

---

## 🔧 PASSO 6: FUNÇÃO onSubmit (5 min)

**Linha ~380 - Dentro de `onSubmit`**

- [ ] Adicionar cálculo do total
- [ ] Incluir todos os 8 novos campos no payload
- [ ] Verificar tipos de dados
- [ ] Salvar (Ctrl+S)

---

## 🧪 PASSO 7: TESTAR LOCALMENTE (10 min)

**No Replit**

- [ ] Rodar servidor local
- [ ] Abrir página de Contratos
- [ ] Testar criar novo contrato
- [ ] Verificar se todos os campos aparecem
- [ ] Testar cálculo automático
- [ ] Verificar checkboxes
- [ ] Corrigir erros (se houver)

---

## 🚀 PASSO 8: DEPLOY (5 min)

**Git**

- [ ] `git add .`
- [ ] `git commit -m "Adicionar campos PF/PJ e composição no frontend"`
- [ ] `git push`
- [ ] Aguardar deploy no Render (3-5 min)

---

## ✅ PASSO 9: TESTAR EM PRODUÇÃO (10 min)

**No Render (https://rental-manager-6mdw.onrender.com)**

- [ ] Fazer login
- [ ] Ir em Contratos
- [ ] Criar novo contrato
- [ ] Preencher todos os campos
- [ ] Verificar cálculo automático
- [ ] Salvar contrato
- [ ] Verificar se salvou corretamente
- [ ] Editar contrato
- [ ] Verificar se campos carregam
- [ ] Gerar recibo (ir em Recebimentos)
- [ ] Verificar PDF com novos campos

---

## 🎯 PASSO 10: LIMPEZA (2 min)

**Render - Environment**

- [ ] Verificar se `SEED_DATABASE` foi removido
- [ ] Se ainda existe, DELETAR
- [ ] Salvar mudanças

---

## 🎊 RESULTADO FINAL

Depois de completar todos os passos:

✅ Frontend 100% funcional  
✅ Campos PF/PJ funcionando  
✅ Composição do aluguel calculando  
✅ Reembolsos configuráveis  
✅ IVA/IBS preparado  
✅ Recibos completos  
✅ Sistema profissional  

---

## 📊 TEMPO TOTAL ESTIMADO

- ⏰ Implementação: 50 minutos
- ⏰ Testes: 20 minutos
- ⏰ Total: ~1 hora e 10 minutos

---

## 🆘 SE TIVER PROBLEMAS

### **Erro de sintaxe TypeScript:**
- Verificar vírgulas
- Verificar parênteses
- Verificar imports

### **Campos não aparecem:**
- Verificar se salvou arquivo
- Fazer rebuild completo
- Limpar cache do navegador

### **Cálculo não funciona:**
- Verificar `form.watch()`
- Verificar parseFloat
- Verificar nomes dos campos

### **Deploy falha:**
- Ver logs do Render
- Verificar erros de build
- Verificar imports

---

## 📞 PRECISA DE AJUDA?

Consulte:
- 📄 ATUALIZACAO_FRONTEND_CONTRATOS.md (passo a passo detalhado)
- 📄 IMPLEMENTACAO_COMPLETA.md (referência técnica)
- 📄 RESUMO_FINAL_IMPLEMENTACAO.md (visão geral)

---

✨ **BOA SORTE!** ✨

Você está a 1 hora de ter um sistema COMPLETO e PROFISSIONAL! 🚀

---

📌 Data: Janeiro 2026  
👨‍💻 Desenvolvedor: Dacio  
🎯 Objetivo: Sistema de Gestão de Aluguéis V2.0
