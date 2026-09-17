# Sorteador de Grupos

Aplicação web para formar ou importar grupos, sortear a ordem das apresentações, controlar o tempo e registrar uma nota individual para cada estudante. Ao final, o sistema gera uma planilha Excel (`.xlsx`) formatada com todos os alunos, seus grupos, notas e situações.

O projeto funciona inteiramente no navegador: não envia dados para servidores e não exige instalação, banco de dados ou etapa de build.

## Recursos

- Formação aleatória e equilibrada de grupos.
- Importação de grupos prontos em HTML, XLSX, XLS, CSV ou TXT.
- Exportação dos grupos para uma planilha Excel formatada.
- Sorteio animado e sem repetição da ordem de apresentação.
- Tempo único configurável para todos os grupos.
- Aviso sonoro agradável ao final do cronômetro.
- Nota máxima configurável e suporte a valores decimais.
- Nota individual para cada aluno.
- Registro de ausência com nota zero automática.
- Janelas de confirmação e aviso estilizadas.
- Recuperação do andamento pelo armazenamento local do navegador.
- Exportação final para Excel com resumo e lista completa de avaliações.

## Como executar

É possível abrir o arquivo `index.html` diretamente. Para evitar limitações do navegador ao trabalhar com arquivos locais, recomenda-se usar um servidor HTTP simples:

```powershell
Primeiro navegue até a página do sorteador pelo cmd, powershell ou terminal.

Após isso execute o comando:
python -m http.server 8000
```

Depois, acesse [http://localhost:8000](http://localhost:8000).

## Como usar

1. Na página inicial, forme novos grupos ou importe um arquivo com grupos existentes.
2. Caso esteja formando uma turma, informe a quantidade de grupos e alunos e faça o sorteio.
3. Exporte os grupos para Excel, se quiser guardá-los para uma apresentação futura.
4. Clique em **Iniciar apresentações**.
5. Defina o tempo de apresentação e a nota máxima. A mesma duração será aplicada a todos os grupos.
6. Sorteie o próximo grupo e inicie o cronômetro.
7. Ao terminar, atribua uma nota individual a cada aluno. Marque **Ausente** para registrar nota zero.
8. Repita até todos os grupos apresentarem e baixe a planilha final em XLSX.

## Formato dos arquivos importados

Para XLSX, XLS e CSV, a primeira linha deve ter as colunas `Grupo` e `Aluno`, com uma pessoa por linha:

| Grupo | Aluno |
|---|---|
| 1 | Ana Souza |
| 1 | Bruno Lima |
| 2 | Carla Dias |

O TXT também aceita o formato em blocos:

```text
GRUPO 1
Ana Souza
Bruno Lima

GRUPO 2
Carla Dias
```

Arquivos HTML exportados pelo próprio sistema ou contendo grupos em listas também podem ser importados.

## Publicar no GitHub Pages

O projeto é estático e pode ser publicado sem configuração adicional:

1. Crie um repositório no GitHub e envie todos os arquivos desta pasta.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main`, a pasta `/ (root)` e clique em **Save**.

O GitHub exibirá o endereço público assim que a publicação terminar.

## Testes

Os testes usam apenas Node.js e podem ser executados no PowerShell:

```powershell
Get-ChildItem tests -Filter *.test.js | ForEach-Object { node $_.FullName }
```

## Estrutura principal

- `index.html`: criação, importação e exibição dos grupos.
- `apresentacoes.html`: sorteio da ordem, cronômetro e avaliações.
- `style.css`: identidade visual, responsividade e animações.
- `group-*.js`: regras de formação, importação e exportação dos grupos.
- `presentation-*.js`: regras do cronômetro, som e exportação das avaliações.
- `script.js` e `apresentacoes.js`: integração das páginas com a interface.
- `tests/`: testes automatizados das regras e do contrato das páginas.
- `vendor/`: biblioteca local para leitura e criação de arquivos Excel.

## Privacidade

Os nomes, grupos, notas e arquivos importados permanecem no dispositivo do usuário. O estado da sessão é armazenado somente no `localStorage` do navegador, e as planilhas são geradas localmente.

## Dependência de terceiros

O projeto inclui localmente a biblioteca `xlsx-js-style`. A licença correspondente está disponível em `vendor/xlsx-js-style.LICENSE.txt`.
