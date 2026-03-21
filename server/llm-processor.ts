import { invokeLLM } from "./_core/llm";

interface AffiliateLink {
  id: number;
  campaignId: number;
  name: string;
  keywords?: string | null;
}

interface LLMResult {
  suggestion: string;
  campaignId?: number;
  campaignName?: string;
}

export async function processMessageWithLLM(
  messageText: string,
  affiliateLinks: AffiliateLink[]
): Promise<LLMResult> {
  if (!affiliateLinks.length) {
    return { suggestion: "Nenhum link de afiliado disponível." };
  }

  // Group links by campaign
  const campaignMap = new Map<number, { name: string; keywords: string[] }>();
  for (const link of affiliateLinks) {
    if (!campaignMap.has(link.campaignId)) {
      campaignMap.set(link.campaignId, { name: link.name, keywords: [] });
    }
    if (link.keywords) {
      campaignMap.get(link.campaignId)!.keywords.push(link.keywords);
    }
  }

  const campaignList = Array.from(campaignMap.entries())
    .map(([id, info]) => `ID ${id}: "${info.name}" (palavras-chave: ${info.keywords.join(", ") || "nenhuma"})`)
    .join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em marketing de afiliados. 
Analise o conteúdo de uma mensagem do WhatsApp e identifique qual campanha de afiliado é mais relevante.
Responda em JSON com o formato: {"campaignId": number, "campaignName": string, "reason": string}
Se nenhuma campanha for relevante, retorne: {"campaignId": null, "campaignName": null, "reason": string}`,
        },
        {
          role: "user",
          content: `Mensagem recebida:\n"${messageText.slice(0, 500)}"\n\nCampanhas disponíveis:\n${campaignList}\n\nQual campanha é mais adequada para esta mensagem?`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "campaign_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              campaignId: { type: ["integer", "null"], description: "ID da campanha sugerida" },
              campaignName: { type: ["string", "null"], description: "Nome da campanha sugerida" },
              reason: { type: "string", description: "Motivo da sugestão" },
            },
            required: ["campaignId", "campaignName", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : null;
    if (!content) return { suggestion: "Sem resposta do LLM." };

    const parsed = JSON.parse(content);
    return {
      suggestion: parsed.reason || "Campanha sugerida pelo LLM.",
      campaignId: parsed.campaignId ?? undefined,
      campaignName: parsed.campaignName ?? undefined,
    };
  } catch (err) {
    console.error("[LLM] Error processing message:", err);
    return { suggestion: "Erro ao processar com LLM." };
  }
}
