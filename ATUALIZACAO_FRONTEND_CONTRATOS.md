# 📝 ATUALIZAÇÃO DO FORMULÁRIO DE CONTRATOS

## 🎯 Arquivo: `client/src/pages/contracts.tsx`

---

## PASSO 1: ATUALIZAR SCHEMA (Linha ~50)

Encontre:
```typescript
const contractFormSchema = z.object({
```

E ADICIONE estes campos APÓS `status:`:
```typescript
  // NOVOS CAMPOS - PF/PJ
  tenantType: z.enum(["pf", "pj"]).default("pf"),
  
  // NOVOS CAMPOS - COMPOSIÇÃO
  rentBaseValue: z.string().optional(),
  iptuValue: z.string().optional(),
  condominiumValue: z.string().optional(),
  iptuReimbursable: z.boolean().optional(),
  condominiumReimbursable: z.boolean().optional(),
  
  // NOVOS CAMPOS - IVA/IBS
  ivaIbsSubject: z.boolean().optional(),
  ivaIbsRate: z.string().optional(),
```

---

## PASSO 2: ATUALIZAR defaultValues NO FORM (Linha ~340)

Encontre:
```typescript
defaultValues: {
```

E ADICIONE estes valores APÓS `status:`:
```typescript
  tenantType: (contract?.tenantType as any) || "pf",
  rentBaseValue: contract?.rentBaseValue?.toString() || "",
  iptuValue: contract?.iptuValue?.toString() || "0",
  condominiumValue: contract?.condominiumValue?.toString() || "0",
  iptuReimbursable: contract?.iptuReimbursable || false,
  condominiumReimbursable: contract?.condominiumReimbursable || false,
  ivaIbsSubject: contract?.ivaIbsSubject !== false,
  ivaIbsRate: contract?.ivaIbsRate?.toString() || "0",
```

---

## PASSO 3: ADICIONAR CAMPOS NO FORMULÁRIO (Linha ~450)

APÓS o campo `tenantPhone`, ADICIONE:
```typescript
        {/* NOVO CAMPO - PF/PJ */}
        <FormField
          control={form.control}
          name="tenantType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Locatário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pf">Pessoa Física (CPF)</SelectItem>
                  <SelectItem value="pj">Pessoa Jurídica (CNPJ)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
```

---

## PASSO 4: SUBSTITUIR SEÇÃO DE VALORES (Linha ~540)

SUBSTITUA toda a div com `rentValue`, `dueDay`, `status` por:
```typescript
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Composição do Aluguel</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentBaseValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Base do Aluguel</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2500.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iptuValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IPTU Mensal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center space-x-2 mt-2">
                    <FormField
                      control={form.control}
                      name="iptuReimbursable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 text-sm">
                            Reembolsável (não tributável)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condominiumValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condomínio Mensal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center space-x-2 mt-2">
                    <FormField
                      control={form.control}
                      name="condominiumReimbursable"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 text-sm">
                            Reembolsável (não tributável)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rentValue"
              render={({ field }) => {
                // Calcular valor total automaticamente
                const base = parseFloat(form.watch("rentBaseValue") || "0");
                const iptu = parseFloat(form.watch("iptuValue") || "0");
                const cond = parseFloat(form.watch("condominiumValue") || "0");
                const total = base + iptu + cond;
                
                return (
                  <FormItem>
                    <FormLabel>Valor Total Mensal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={total.toFixed(2)}
                        disabled
                        className="font-bold"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Calculado automaticamente
                    </p>
                  </FormItem>
                );
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de Vencimento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Dia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* NOVA SEÇÃO - IVA/IBS */}
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Reforma Tributária (IVA/IBS)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ivaIbsSubject"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 mt-1"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0">
                      Sujeito a IVA/IBS
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marque se este contrato está sujeito à Reforma Tributária
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ivaIbsRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alíquota IVA/IBS (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Alíquota estimada (ex: 12.5%)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
```

---

## PASSO 5: ATUALIZAR onSubmit (Linha ~380)

Encontre a função `onSubmit` e ATUALIZE o payload:
```typescript
  function onSubmit(data: ContractFormData) {
    // Calcular valor total
    const base = parseFloat(data.rentBaseValue || "0");
    const iptu = parseFloat(data.iptuValue || "0");
    const cond = parseFloat(data.condominiumValue || "0");
    const total = base + iptu + cond;
    
    const payload: any = {
      ...data,
      rentValue: total.toString(),
      tenantEmail: data.tenantEmail || null,
      tenantPhone: data.tenantPhone || null,
      dueDay: parseInt(data.dueDay),
      
      // NOVOS CAMPOS
      tenantType: data.tenantType || "pf",
      rentBaseValue: data.rentBaseValue || null,
      iptuValue: data.iptuValue || "0",
      condominiumValue: data.condominiumValue || "0",
      iptuReimbursable: data.iptuReimbursable || false,
      condominiumReimbursable: data.condominiumReimbursable || false,
      ivaIbsSubject: data.ivaIbsSubject !== false,
      ivaIbsRate: data.ivaIbsRate || "0",
      
      // CAMPOS ANTIGOS
      adminFeePercent: data.adminFeePercent || null,
      adjustmentIndex: data.adjustmentIndex || null,
      adjustmentPercent: data.adjustmentPercent || null,
      nextAdjustmentDate: data.nextAdjustmentDate || null,
      lastAdjustmentDate: null,
      documents: uploadedDocuments.length > 0 ? uploadedDocuments : null,
    };
    
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }
```

---

## ✅ CHECKLIST

- [ ] Passo 1: Schema atualizado
- [ ] Passo 2: defaultValues atualizados
- [ ] Passo 3: Campo PF/PJ adicionado
- [ ] Passo 4: Seção de composição criada
- [ ] Passo 5: onSubmit atualizado
- [ ] Salvar arquivo (Ctrl+S)
- [ ] Commit e push

---

## 🎯 RESULTADO

Depois dessas alterações, o formulário terá:
✅ Seleção PF/PJ
✅ Composição do aluguel (base + IPTU + condomínio)
✅ Checkboxes de reembolso
✅ Cálculo automático do total
✅ Configuração IVA/IBS
✅ 100% funcional com backend

---

## 📝 NOTAS

- Use o editor visual do Replit para facilitar
- Copie e cole cada seção com cuidado
- Teste após cada passo se preferir
- Mantenha a indentação correta

