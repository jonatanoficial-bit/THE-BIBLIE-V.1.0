# Bíblia Premium – Aplicativo Mobile‑First em HTML, CSS e JavaScript

Bem‑vindo ao **Bíblia Premium**, um aplicativo web com foco em dispositivos móveis que oferece devocionais, estudos bíblicos, várias traduções da Bíblia, esboços de pregação e conteúdos temáticos. O projeto foi concebido para entregar uma experiência **AAA** com visual profissional, microinterações suaves e arquitetura expansível para futuras *DLCs*.

## Principais recursos

- **Mobile‑first e responsivo:** O layout foi desenvolvido pensando primeiro em smartphones e funciona perfeitamente em tablets e desktops, mantendo a legibilidade e a fluidez.
- **Visual Premium:** Utilizamos gradientes sofisticados, sombras suaves, microinterações e tipografia impecável para criar uma aparência digna de aplicativos de alto padrão. Animar botões e feedbacks imediatos seguem boas práticas de microinterações, que sugerem que pequenas animações devem ser propositais, sutis e fornecer feedback instantâneo ao usuário【459995116724399†L40-L80】【459995116724399†L86-L129】. O tema suporta modo claro e escuro, com cores definidas por variáveis CSS conforme as recomendações de design em 2025【680467973575663†L79-L116】.
- **Conteúdo modular:** Toda a informação (devocionais, estudos, temas, etc.) é carregada dinamicamente a partir de arquivos JSON em `/content`. O arquivo `manifest.json` lista os módulos disponíveis e controla se estão habilitados. Novas expansões podem ser adicionadas sem alterar o código principal.
- **Área Administrativa:** Uma interface de administração permite ativar/desativar módulos, criar DLCs personalizadas e exportar um manifesto atualizado. O login local utiliza credenciais padrão (usuário: **admin** / senha: **admin123**) e pode ser estendido para um backend futuro.
- **Arquitetura expansível:** O projeto é organizado para crescer. Pastas claras (`content/` para dados, `admin/` para interface administrativa, `assets/` para imagens), código comentado e separação de responsabilidades facilitam a manutenção.

## Estrutura de diretórios

```
bible_app/
│  index.html          # Página principal da aplicação
│  style.css           # Estilos globais (tema claro/escuro, gradientes, cards)
│  app.js              # Lógica de carregamento de módulos e renderização
│  README.md           # Este arquivo
├─ content/            # Conteúdo dinâmico em JSON
│   │  manifest.json   # Lista de módulos (DLCs) e suas versões
│   │  base.json       # Conteúdo base (devocionais, estudos, etc.)
│   └─ expansion_sample.json # Exemplo de expansão
├─ admin/              # Área administrativa
│   │  index.html      # Página de administração (login e painel)
│   │  admin.js        # Lógica de autenticação e gestão de DLCs
│   └─ admin.css       # Estilos específicos da área administrativa
└─ assets/             # Imagens, fontes ou ícones adicionais (opcional)
```

## Como executar o projeto localmente

1. **Clonar ou baixar** este repositório e garantir que todos os arquivos estejam na mesma hierarquia.
2. Abrir o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Safari, Edge). Não são necessários servidores adicionais; todas as dependências são locais.
3. Navegue pelas seções usando o menu superior. Ao clicar em um item, o conteúdo correspondente é carregado e mostrado de forma dinâmica. O menu de tema permite alternar entre claro e escuro.
4. Para acessar a **área administrativa**, clique em “Admin” no menu. Use as credenciais padrão (`admin` / `admin123`). A partir do painel é possível ativar/desativar módulos e criar novos conteúdos personalizados.

## Deploy no GitHub Pages

O projeto é compatível com o GitHub Pages porque consiste apenas em arquivos estáticos. Para publicar:

1. Crie um repositório no GitHub e faça o upload de todo o conteúdo da pasta `bible_app/`.
2. No repositório, acesse **Settings > Pages** e selecione a branch principal (`main` ou `master`) com a pasta raiz `/` como fonte de publicação.
3. Após alguns minutos, o GitHub Pages disponibilizará uma URL para acesso público.

## Conteúdo e expansões (DLC)

O aplicativo utiliza um sistema de DLC para permitir atualizações sem mexer no núcleo:

- **manifest.json:** arquivo que lista os módulos disponíveis. Cada entrada contém um `id`, `name`, `file`, `version` e `enabled`. Apenas módulos com `enabled: true` são carregados. Esta abordagem facilita a gestão de versões e permite ativar ou desativar conteúdos rapidamente.
- **Base.json:** arquivo obrigatório que contém o conteúdo padrão (devocionais, estudos, esboços, temas, etc.).
- **Demais JSONs:** novas expansões devem seguir a mesma estrutura de `base.json`, com a chave `sections` contendo objetos para cada categoria. Veja `expansion_sample.json` como referência.

Para adicionar uma nova expansão manualmente:

1. Crie um arquivo JSON na pasta `content/` seguindo o formato abaixo:
   ```json
   {
     "name": "Nome da Expansão",
     "version": "1.0",
     "enabled": false,
     "sections": {
       "devotionals": [ ... ],
       "studies": [ ... ],
       "outlines": [ ... ],
       "themes": [ ... ]
     }
   }
   ```
2. Adicione uma entrada correspondente em `manifest.json`:
   ```json
   {
     "id": "identificador_da_expansao",
     "name": "Nome da Expansão",
     "file": "identificador_da_expansao.json",
     "version": "1.0",
     "enabled": true
   }
   ```
3. Salve os arquivos e recarregue a página. O novo conteúdo aparecerá quando ativado.

### Utilizando o painel Admin

O painel administrativo é uma ferramenta opcional para ajudar a gerenciar conteúdos sem editar arquivos manualmente. Ele permite:

1. **Login local:** digite as credenciais padrão (pode ser alterado no código). Se preferir integrar com backend no futuro, substitua a lógica de autenticação por uma API.
2. **Ativar/desativar DLCs:** cada módulo aparece com um interruptor. Alterar o estado persiste no `localStorage`. Para refletir no projeto oficial, exporte o manifesto e substitua o arquivo na pasta `content`.
3. **Criar novo módulo:** cole o JSON do módulo na área de texto, informe um nome e versão. O módulo é salvo no `localStorage` com prefixo `custom_` e fica listado na tabela. Para integrá-lo ao projeto, use os botões de exportação para baixar o JSON e atualize o `manifest.json`.
4. **Exportar Manifesto:** gera um arquivo `manifest.json` com as modificações locais (ativação de DLCs e módulos personalizados). Baixe este arquivo e substitua o original para disponibilizar as mudanças para todos.

## Boas práticas de design adotadas

O projeto segue diretrizes modernas de design de interface e microinterações. Estudos recentes em 2025 destacam que microinterações — animações sutis como mudança de cor ao pressionar um botão ou indicadores de carregamento — aumentam o engajamento, melhoram a navegação e criam conexão emocional quando são propositais, consistentes e fornecem feedback imediato【459995116724399†L40-L80】. Essas animações devem ser suaves, nunca exageradas, e economizar recursos para garantir desempenho【459995116724399†L86-L129】.

Quanto ao tema, a tendência de **dark mode** permaneceu forte em 2025 graças à redução de cansaço visual e economia de energia em telas OLED. Implementamos dark mode usando variáveis CSS e a media query `prefers-color-scheme` é suportada através do botão de alternância. O design evita contraste extremo, optando por fundos cinza escuros e textos off‑white conforme as recomendações para acessibilidade【680467973575663†L79-L116】. 

Por fim, a estética **minimalista** e limpa, com foco em espaços em branco, tipografia legível e paleta de cores reduzida, ajuda o usuário a se concentrar no conteúdo importante e melhora a velocidade de carregamento【680467973575663†L122-L163】. Essa filosofia de “menos é mais” está presente em todos os componentes da interface.

## Contribuições futuras

O código foi escrito em **JavaScript puro** com separação de responsabilidades (HTML, CSS e JS). Não utilizamos frameworks para facilitar a auditoria e a integração em diferentes ambientes. Para aprimorar o projeto no futuro, considere:

- Integrar APIs de texto bíblico para exibir versículos completos por versão.
- Adicionar suporte offline com [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) e transformar a aplicação em uma Progressive Web App (PWA).
- Conectar o painel administrativo a um backend real para armazenamento de conteúdo e autenticação segura.
- Expandir microinterações com haptics em dispositivos móveis ou animações personalizadas com base no comportamento do usuário.

---

Esperamos que este aplicativo inspire momentos de estudo e devoção. Sinta‑se à vontade para adaptar e expandir o código conforme suas necessidades.
