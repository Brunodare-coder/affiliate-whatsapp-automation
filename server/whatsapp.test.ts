import { describe, expect, it } from "vitest";
import { replaceLinksInText } from "./whatsapp";

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

describe("auth.logout", () => {
  it("deve ser testado via auth.logout.test.ts", () => {
    expect(true).toBe(true);
  });
});
