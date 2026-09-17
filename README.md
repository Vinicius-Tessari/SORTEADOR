# Sorteador de Grupos

Aplicação web para formar ou importar grupos, sortear a ordem das apresentações, controlar o tempo e registrar avaliações individuais. Ao final, o sistema gera uma planilha Excel (`.xlsx`) formatada com todos os alunos, grupos, notas, situações e observações.

O projeto funciona inteiramente no navegador: não exige instalação, conta, servidor, banco de dados ou etapa de build. Os dados permanecem no computador do usuário.

## Funcionalidades

### Formação dos grupos

- Configuração da quantidade de grupos e de alunos.
- Distribuição aleatória e equilibrada dos estudantes.
- Diferença máxima de uma pessoa entre os tamanhos dos grupos.
- Animação durante o sorteio de cada aluno.
- Indicadores de progresso, vagas e alunos restantes.
- Bloqueio de nomes duplicados, ignorando diferenças de maiúsculas e espaços extras.
- Reinício completo da formação mediante confirmação.

### Importação de grupos prontos

- Importação de arquivos HTML, XLSX, XLS, CSV e TXT.
- Leitura das colunas `Grupo` e `Aluno`, com uma pessoa por linha.
- Reconhecimento dos cabeçalhos independentemente de maiúsculas, espaços e acentos.
- Compatibilidade com CSV separado por vírgula ou ponto e vírgula.
- Leitura de TXT organizado em blocos com títulos como `GRUPO 1` e `GRUPO 2`.
- Leitura de HTML com dados incorporados, cartões de grupos ou títulos seguidos de listas.
- Validação de grupos vazios, linhas incompletas e alunos duplicados.

### Edição dos grupos

- Correção do nome de qualquer estudante.
- Inclusão e remoção de alunos.
- Transferência de alunos entre grupos.
- Inclusão de novos grupos.
- Remoção de grupos vazios.
- Validação antes de salvar para impedir grupos vazios ou nomes duplicados.
- Caso já existam apresentações ou notas, o sistema solicita confirmação antes de reiniciar somente esse progresso.

### Exportação dos grupos

- Exportação dos grupos formados para Excel (`grupos-sorteados.xlsx`).
- Planilha com título, cabeçalhos, cores, larguras e linhas alternadas.
- Útil para guardar a formação e realizar as apresentações em outro momento.

### Sorteio das apresentações

- Sorteio aleatório da ordem de apresentação.
- Cada grupo aparece apenas uma vez.
- Grupos apresentados ou já sorteados não são repetidos.
- Animação de roleta com revelação do grupo escolhido e de seus integrantes.
- Barra de progresso com a quantidade de apresentações concluídas.

### Configuração e controle do cronômetro

- Uma duração única configurável para todos os grupos.
- Definição por minutos e segundos.
- Início manual após a revelação do grupo sorteado.
- Pausa e continuação do cronômetro.
- Acréscimo de 30 segundos.
- Acréscimo de 1 minuto.
- Reinício do tempo completo do grupo mediante confirmação.
- Encerramento antecipado da apresentação.
- Aviso visual nos segundos finais.
- Sinal sonoro agradável quando o tempo chega a zero.

### Modo projetor

- Tela separada e limpa para exibição em projetor ou segunda tela.
- Sincronização automática com a tela do professor.
- Exibição da roleta durante o sorteio dos grupos.
- Revelação do grupo vencedor e de seus integrantes.
- Exibição do grupo atual, estudantes e cronômetro.
- Indicação de apresentação em andamento, pausada ou encerrada.
- Notas, observações e controles administrativos não aparecem no projetor.

### Avaliação dos estudantes

- Configuração da nota máxima da atividade com valor maior que zero e de até 100.
- Suporte a notas individuais com até duas casas decimais.
- Aceitação de vírgula ou ponto como separador decimal.
- Campo de observação individual para cada aluno.
- Campo de observação geral para cada grupo.
- Marcação de aluno ausente.
- Alunos ausentes recebem nota zero automaticamente.
- Resumo final com quantidade de avaliados, ausentes e média geral.

### Planilha final de avaliações

- Exportação das avaliações para `notas-apresentacoes.xlsx`.
- Planilha formatada com título, nota máxima, filtros, cores e linhas alternadas.
- Linhas de estudantes ausentes recebem destaque visual.
- Observações possuem colunas largas e quebra automática de texto.
- A planilha contém:
  - Aluno;
  - Grupo;
  - Nota;
  - Situação;
  - Observação individual;
  - Observação do grupo.

### Salvar e continuar depois

- Exportação da sessão completa para um arquivo JSON.
- O arquivo inclui grupos, configuração, ordem sorteada, apresentações concluídas, notas, ausências e observações.
- A sessão pode ser retomada em outro computador ou navegador.
- Se for salva durante uma apresentação, o tempo restante é preservado e a sessão é restaurada pausada.
- Validação do arquivo antes de substituir a sessão atual.
- Migração automática de sessões antigas compatíveis.

### Persistência e interface

- Salvamento automático no `localStorage` do navegador.
- Recuperação da formação, do cronômetro e das avaliações após atualizar a página.
- Modais estilizados para confirmações e mensagens de erro.
- Layout responsivo para computadores, tablets e celulares.
- Campos numéricos sem as setas nativas do navegador.
- Respeito à preferência do sistema por redução de movimento.

## Como executar

É possível abrir o arquivo `index.html` diretamente em um navegador moderno. Para evitar limitações de arquivos locais — principalmente ao usar mais de uma tela — recomenda-se executar um servidor HTTP simples.

Primeiro, abra o CMD, PowerShell ou terminal na pasta do projeto. Depois execute:

```powershell
Primeiro navegue até a página do sorteador pelo cmd, powershell ou terminal.

Após isso execute o comando:
python -m http.server 8000
```

Acesse [http://localhost:8000](http://localhost:8000) no navegador.

## Fluxo de utilização

1. Forme novos grupos ou importe um arquivo com grupos existentes.
2. Caso esteja formando a turma, informe as quantidades e sorteie cada aluno.
3. Use **Editar grupos** para corrigir nomes, adicionar, remover ou transferir estudantes.
4. Use **Exportar grupos (XLSX)** se quiser guardar a formação para outro momento.
5. Clique em **Iniciar apresentações**.
6. Configure o tempo único e a nota máxima.
7. Abra o **Modo projetor** em outra tela, se desejar.
8. Sorteie o próximo grupo e acompanhe a roleta nas duas telas.
9. Inicie o cronômetro e use os controles de pausa ou acréscimo de tempo quando necessário.
10. Ao finalizar, registre as notas, ausências e observações.
11. Repita o processo até todos os grupos apresentarem.
12. Baixe a planilha final em XLSX.

Durante qualquer etapa, use **Salvar sessão** para baixar um JSON. Na mesma máquina ou em outro computador, escolha **Retomar sessão** para continuar.

## Formato dos arquivos importados

### Excel e CSV

A primeira linha deve conter as colunas `Grupo` e `Aluno`, com uma pessoa em cada linha:

| Grupo | Aluno |
|---|---|
| 1 | João Santos |
| 1 | Bruno Souza |
| 2 | Carlos Silva |

São aceitos arquivos XLSX, XLS e CSV.

### TXT

O TXT pode utilizar as mesmas colunas separadas por vírgula, ponto e vírgula ou tabulação. Também pode ser organizado em blocos:

```text
GRUPO 1
João Santos
Bruno Souza

GRUPO 2
Carlos Silva
```

### HTML

O sistema aceita HTMLs exportados pelo próprio projeto ou páginas que contenham grupos em listas. Também reconhece dados JSON incorporados em um elemento com o identificador `groupsData`.

## Arquivos gerados

| Arquivo | Conteúdo |
|---|---|
| `grupos-sorteados.xlsx` | Formação atual dos grupos |
| `sessao-apresentacoes-AAAA-MM-DD.json` | Sessão completa para continuar depois |
| `notas-apresentacoes.xlsx` | Notas, situações e observações finais |

## Estrutura principal

- `index.html`: criação, importação, edição e visualização dos grupos.
- `apresentacoes.html`: sorteio da ordem, cronômetro e avaliações.
- `projetor.html`: tela pública para projeção.
- `style.css`: identidade visual, responsividade e animações.
- `group-logic.js`: formação e edição dos grupos.
- `group-import-logic.js`: leitura dos formatos importados.
- `group-export.js`: planilha Excel dos grupos.
- `presentation-logic.js`: sessão, cronômetro, avaliações e migração.
- `presentation-alarm.js`: aviso sonoro do cronômetro.
- `presentation-export.js`: planilha final das avaliações.
- `session-file.js`: exportação e restauração da sessão portátil.
- `projector-logic.js` e `projetor.js`: sincronização e interface do projetor.
- `script.js` e `apresentacoes.js`: integração das páginas com a interface.
- `ui-dialog.js`: confirmações e avisos estilizados.
- `spreadsheet-style.js`: estilos compartilhados das planilhas.
- `tests/`: testes automatizados.
- `vendor/`: biblioteca local para leitura e criação de arquivos Excel.

## Privacidade

Os nomes, grupos, notas, observações e arquivos importados permanecem no dispositivo do usuário. O estado é armazenado apenas no `localStorage`, e as planilhas e sessões são geradas localmente.

O sistema não possui servidor próprio, rastreamento, autenticação ou envio automático de dados.

## Dependência de terceiros

O projeto inclui localmente a biblioteca `xlsx-js-style`. A licença correspondente está disponível em `vendor/xlsx-js-style.LICENSE.txt`.

As fontes Inter e Lora são solicitadas ao Google Fonts quando há conexão com a internet. Caso não estejam disponíveis, o navegador utiliza as fontes alternativas configuradas no sistema sem impedir o funcionamento da aplicação.
