# WM Psicologia

Site estático (HTML, CSS e JavaScript puro) da WM Psicologia, de Willian Santos e Maria Vitória Brandão.

## Páginas

- `index.html`: página provisória "Em breve" (home do domínio por enquanto)
- `site/index.html`: landing page com 9 seções, acessível em `/site/` enquanto o site não é lançado
- `links/index.html`: página de links (biolink), acessível em `/links/`
- `links/willian/` e `links/mavi/`: páginas de links individuais de cada profissional
- `404.html`: página de erro, ativada pelo `.htaccess`

## Lançamento (tirar o "Em breve")

1. Substituir o `index.html` da raiz pelo `site/index.html`, trocando `../assets/`, `../favicon-48.png` e `../apple-touch-icon.png` por `assets/`, `favicon-48.png` e `apple-touch-icon.png`.
2. Remover o `<meta name="robots" content="noindex">` da landing.
3. Nas páginas de links, trocar `site/` por `` (ex.: `../site/#duvidas` vira `../#duvidas`, `../../site/` vira `../../`) e, na 404, `/site/#agendar` vira `/#agendar`.
4. Apagar a pasta `site/`.

## Estrutura

```
assets/css/style.css   estilos compartilhados
assets/js/main.js      coreografia de motion (GSAP), header e FAQ
assets/js/river.js     o "rio" animado em canvas
assets/js/vendor/      GSAP 3.15 (licença padrão gratuita) e Lenis, auto-hospedados
assets/img/            fotos otimizadas (WebP) e símbolos das marcas
assets/fonts/          Aleiakids (títulos) e Inter (textos), auto-hospedadas
.htaccess              página 404, cache e compressão (Hostinger)
```

## Publicação

O deploy é feito pelo Git da Hostinger (hPanel > Avançado > Git), branch `main`, diretório `public_html`.
Cada push na `main` atualiza o site.

Os caminhos usam `/` a partir da raiz do domínio, então o site precisa ficar na raiz (`public_html`), não em uma subpasta.

## Editar contatos

Os links de WhatsApp aparecem em `index.html` (Em breve), `site/index.html`, `links/index.html` e nas páginas individuais em `links/willian/` e `links/mavi/`:

- Willian: `https://wa.me/5544998460313`
- Maria Vitória: `https://wa.me/5544991788720`

O domínio usado em canonical, Open Graph, `robots.txt` e `sitemap.xml` é `wmpsicologia.com.br`.

## Motion

A abertura com a ponte aparece uma vez por sessão (clique ou tecla acelera). Quem ativa "reduzir movimento" no sistema vê o site completo, sem animações.
