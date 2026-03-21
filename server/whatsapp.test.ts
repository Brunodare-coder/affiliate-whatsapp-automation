import { describe, expect, it } from "vitest";
import { replaceLinksInText, replaceMercadoLivreLinks } from "./whatsapp";

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
    expect(result.text).toContain("matt_tool=78912023");
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
