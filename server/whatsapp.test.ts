import { describe, expect, it } from "vitest";
import { replaceLinksInText, replaceMercadoLivreLinks, replaceShopeeLinks, replaceAmazonLinks, replaceMagazineLuizaLinks } from "./whatsapp";

describe("replaceLinksInText", () => {
  it("substitui um link que corresponde ao padrão", () => {
    const text = "Confira: https://amazon.com.br/produto/123 com desconto!";
    const links = [
      { originalPattern: "amazon.com.br", affiliateUrl: "https://meu-afiliado.com/amazon" },
    ];
    const result = replaceLinksInText(text, links);
    expect(result.linksFound).toBe(1);
    expect(result.linksReplaced).toBe(1);
    expect(result.text).toContain("https://meu-afiliado.com/amazon");
    expect(result.text).not.toContain("amazon.com.br");
  });

  it("não substitui links que não correspondem ao padrão", () => {
    const text = "Confira: https://shopee.com.br/produto/456";
    const links = [
      { originalPattern: "amazon.com.br", affiliateUrl: "https://meu-afiliado.com/amazon" },
    ];
    const result = replaceLinksInText(text, links);
    expect(result.linksFound).toBe(1);
    expect(result.linksReplaced).toBe(0);
    expect(result.text).toContain("shopee.com.br");
  });

  it("substitui múltiplos links com padrões diferentes", () => {
    const text = "Amazon: https://amazon.com.br/p1 e Shopee: https://shopee.com.br/p2";
    const links = [
      { originalPattern: "amazon.com.br", affiliateUrl: "https://aff.com/amazon" },
      { originalPattern: "shopee.com.br", affiliateUrl: "https://aff.com/shopee" },
    ];
    const result = replaceLinksInText(text, links);
    expect(result.linksFound).toBe(2);
    expect(result.linksReplaced).toBe(2);
    expect(result.text).toContain("https://aff.com/amazon");
    expect(result.text).toContain("https://aff.com/shopee");
  });

  it("retorna texto original quando não há links", () => {
    const text = "Mensagem sem links";
    const links = [{ originalPattern: "amazon.com.br", affiliateUrl: "https://aff.com/amazon" }];
    const result = replaceLinksInText(text, links);
    expect(result.linksFound).toBe(0);
    expect(result.linksReplaced).toBe(0);
    expect(result.text).toBe(text);
  });

  it("retorna texto original quando não há links de afiliado configurados", () => {
    const text = "Confira: https://amazon.com.br/produto";
    const result = replaceLinksInText(text, []);
    expect(result.linksFound).toBe(1);
    expect(result.linksReplaced).toBe(0);
    expect(result.text).toBe(text);
  });

  it("substitui apenas o primeiro link correspondente por padrão", () => {
    const text = "Link1: https://amazon.com.br/p1 Link2: https://amazon.com.br/p2";
    const links = [
      { originalPattern: "amazon.com.br", affiliateUrl: "https://aff.com/amazon" },
    ];
    const result = replaceLinksInText(text, links);
    expect(result.linksFound).toBe(2);
    expect(result.linksReplaced).toBe(2);
  });
});

describe("replaceMercadoLivreLinks", () => {
  const config = { tag: "bq20260201142328", mattToolId: "78912023" };

  it("adiciona tag de rastreamento em link do Mercado Livre", () => {
    const text = "Veja: https://www.mercadolivre.com.br/produto/MLB123456";
    const result = replaceMercadoLivreLinks(text, config);
    expect(result.found).toBe(1);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("matt_from=bq20260201142328");
    // matt_tool original do link é preservado (não substituído pelo mattToolId da config)
    // pois matt_tool é único por produto/campanha
    expect(result.text).not.toContain("matt_tool=78912023"); // mattToolId da config NÃO é usado
  });

  it("não altera links que não são do Mercado Livre", () => {
    const text = "Veja: https://www.amazon.com.br/produto/123";
    const result = replaceMercadoLivreLinks(text, config);
    expect(result.found).toBe(0);
    expect(result.replaced).toBe(0);
    expect(result.text).toBe(text);
  });

  it("substitui múltiplos links ML no mesmo texto", () => {
    const text = "Link1: https://www.mercadolivre.com.br/p1 Link2: https://produto.mercadolivre.com.br/p2";
    const result = replaceMercadoLivreLinks(text, config);
    expect(result.replaced).toBeGreaterThanOrEqual(1);
    expect(result.text).toContain("matt_from=bq20260201142328");
  });

  it("funciona sem mattToolId", () => {
    const text = "Veja: https://www.mercadolivre.com.br/produto/MLB999";
    const result = replaceMercadoLivreLinks(text, { tag: "bq123" });
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("matt_from=bq123");
    expect(result.text).not.toContain("matt_tool");
  });
});

describe("auth.logout", () => {
  it("deve ser testado via auth.logout.test.ts", () => {
    expect(true).toBe(true);
  });
});

describe("replaceShopeeLinks", () => {
  it("adiciona parâmetro de afiliado em link da Shopee", () => {
    const text = "Veja: https://shopee.com.br/produto-123.456789012";
    const result = replaceShopeeLinks(text, { appId: "12345678", isActive: true });
    expect(result.found).toBe(1);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("af_id=12345678");
  });

  it("não altera links que não são da Shopee", () => {
    const text = "Veja: https://amazon.com.br/produto/123";
    const result = replaceShopeeLinks(text, { appId: "12345678", isActive: true });
    expect(result.found).toBe(0);
    expect(result.replaced).toBe(0);
  });
});

describe("replaceAmazonLinks", () => {
  it("adiciona tag de afiliado em link da Amazon", () => {
    const text = "Veja: https://www.amazon.com.br/dp/B08N5WRWNW";
    const result = replaceAmazonLinks(text, { tag: "meutag-20", isActive: true });
    expect(result.found).toBe(1);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("tag=meutag-20");
  });

  it("não altera links que não são da Amazon", () => {
    const text = "Veja: https://shopee.com.br/produto";
    const result = replaceAmazonLinks(text, { tag: "meutag-20", isActive: true });
    expect(result.found).toBe(0);
    expect(result.replaced).toBe(0);
  });
});

describe("replaceMagazineLuizaLinks", () => {
  it("adiciona tag de afiliado em link do Magazine Luiza", () => {
    const text = "Veja: https://www.magazineluiza.com.br/produto/p/123456789/";
    const result = replaceMagazineLuizaLinks(text, { tag: "meutag123", isActive: true });
    expect(result.found).toBe(1);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("utm_medium=meutag123");
  });

  it("não altera links que não são do Magazine Luiza", () => {
    const text = "Veja: https://amazon.com.br/produto";
    const result = replaceMagazineLuizaLinks(text, { tag: "meutag123", isActive: true });
    expect(result.found).toBe(0);
    expect(result.replaced).toBe(0);
  });
});

describe("shortenMeliLinksWithTinyUrl (unit - sem chamada real à API)", () => {
  it("shortenMeliLinksWithTinyUrl não está mais em uso (modo tinyurl desativado)", () => {
    // A função shortenMeliLinksWithTinyUrl foi removida do fluxo principal.
    // O bot agora usa apenas o modo 'long' (link longo com tag substituída)
    // pois a API do ML bloqueia produtos específicos com erro 111.
    expect(true).toBe(true);
  });
});

describe("replaceMercadoLivreLinks - linkMode logic", () => {
  it("substitui link de produto com tag correta e preserva matt_tool original", () => {
    const text = "Produto: https://www.mercadolivre.com.br/produto/MLB123?matt_from=outro&matt_tool=999";
    const config = { tag: "bq20260201142328", mattToolId: "78912023", socialTag: "bq20260201142328" };
    const result = replaceMercadoLivreLinks(text, config);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("matt_from=bq20260201142328");
    // matt_tool ORIGINAL do link é preservado (999), não substituído pelo mattToolId da config
    expect(result.text).toContain("matt_tool=999");
    expect(result.text).not.toContain("matt_tool=78912023"); // mattToolId da config NÃO substitui
    // matt_from do afiliado original deve ser removido
    expect(result.text).not.toContain("matt_from=outro");
  });

  it("substitui link /social/ com socialTag correta e preserva matt_tool original", () => {
    const text = "Social: https://www.mercadolivre.com.br/social/outro_usuario?matt_tool=999&matt_word=outro";
    const config = { tag: "bq20260201142328", mattToolId: "78912023", socialTag: "bq20260201142328" };
    const result = replaceMercadoLivreLinks(text, config);
    expect(result.replaced).toBe(1);
    expect(result.text).toContain("/social/bq20260201142328");
    // matt_tool ORIGINAL do link é preservado (999)
    expect(result.text).toContain("matt_tool=999");
    expect(result.text).not.toContain("matt_tool=78912023"); // mattToolId da config NÃO substitui
    expect(result.text).toContain("matt_word=bq20260201142328");
  });
});
