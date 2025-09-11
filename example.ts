export const tool = ['transcript_yt', {
			schema: {
				type: 'function',
				function: {
					name: 'transcript_yt',
					description:
						'Busca a transcrição de um vídeo do YouTube a partir de sua URL., pode ser utilizado para responder perguntas sobre qualquer vídeo com "youtube" na URL',
					parameters: {
						type: 'object',
						properties: {
							videoUrl: {
								type: 'string',
								description: 'A URL completa do vídeo do YouTube.',
							},
							preferredLanguages: {
								type: 'array',
								items: { type: 'string' },
								description: "Uma lista opcional de códigos de idioma preferenciais (ex: ['pt-BR', 'en']).",
							},
						},
						required: ['videoUrl'],
						additionalProperties: false,
					},
					strict: true,
				},
			},
			/**
			 * Busca a transcrição de um vídeo do YouTube a partir de sua URL.
			 * pode ser utilizado para responder perguntas sobre qualquer vídeo com "youtube" na URL'
			 * @param args - Objeto contendo os parâmetros.
			 * @param args.videoUrl - A URL completa do vídeo do YouTube.
			 * @param args.preferredLanguages - (Opcional) Uma lista de códigos de idioma preferenciais (ex: ['pt-BR', 'en']).
			 * @returns Uma promessa que resolve para um array de objetos de transcrição ou null se a transcrição não for encontrada ou ocorrer um erro.
			 */
			fn: async (args: { videoUrl: string; preferredLanguages?: string[] }): Promise<YouTubeTranscriptSegment[] | null> => {
				/**
				 * Extrai o ID do vídeo a partir de uma URL do YouTube.
				 * @param url URL do vídeo.
				 * @returns ID do vídeo ou null se não encontrado.
				 */
				const extractVideoId = (url: string): string | null => {
					const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
					return match ? match[1] : null;
				};
				/**
				 * Faz GET e retorna o corpo como texto.
				 * @param url URL a buscar.
				 * @param headers Cabeçalhos opcionais.
				 * @returns Resposta em texto.
				 */
				const fetchText = async (url: string, headers: Record<string, string> = {}): Promise<string> => {
					const res = await fetch(url, { headers });
					if (!res.ok) throw new Error(res.statusText);
					return res.text();
				};
				/**
				 * Busca o HTML da página de watch e lida com consentimento quando necessário.
				 * @param videoId ID do vídeo.
				 * @returns HTML da página do vídeo.
				 */
				const fetchWatchHtml = async (videoId: string): Promise<string> => {
					const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
					let html = await fetchText(watchUrl, { 'Accept-Language': 'en-US' });
					if (html.includes('action="https://consent.youtube.com/s"')) {
						const v = html.match(/name="v" value="(.*?)"/);
						if (!v) throw new Error('Consent cookie creation failed');
						html = await fetchText(watchUrl, { 'Accept-Language': 'en-US', 'Cookie': `CONSENT=YES+${v[1]}` });
						if (html.includes('action="https://consent.youtube.com/s"')) throw new Error('Consent cookie invalid');
					}
					return html;
				};
				/**
				 * Extrai a INNERTUBE_API_KEY do HTML.
				 * @param html HTML da página do vídeo.
				 * @returns Chave Innertube.
				 */
				const extractInnertubeApiKey = (html: string): string | null => {
					const m = html.match(/\"INNERTUBE_API_KEY\":\s*\"([a-zA-Z0-9_-]+)\"/);
					return m ? m[1] : null;
				};
				/**
				 * Faz POST para o endpoint Innertube player e retorna o JSON.
				 * @param apiKey Chave Innertube extraída do HTML.
				 * @param videoId ID do vídeo.
				 * @returns JSON de resposta do player.
				 */
				const fetchInnertubePlayer = async (apiKey: string, videoId: string): Promise<any> => {
					const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
					const res = await fetch(url, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en-US' },
						body: JSON.stringify({ context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId }),
					});
					if (res.status === 429) throw new Error('IP blocked');
					if (!res.ok) throw new Error(`YouTube request failed: ${res.status}`);
					return res.json();
				};
				/**
				 * Valida o status de reproduzibilidade e lança erros descritivos.
				 * @param data Objeto playabilityStatus.
				 */
				const assertPlayability = (data: any): void => {
					const status = data?.status;
					if (!status || status === 'OK') return;
					const reason = data?.reason || '';
					if (status === 'LOGIN_REQUIRED') {
						if (reason.includes('not a bot')) throw new Error('Request blocked');
						if (reason.includes('inappropriate')) throw new Error('Age restricted');
					}
					if (status === 'ERROR' && reason.includes('unavailable')) throw new Error('Video unavailable');
					throw new Error(`Video unplayable: ${reason}`);
				};
				/**
				 * Seleciona a melhor faixa de legenda, priorizando manual sobre ASR e idiomas preferidos.
				 * @param tracks Lista de faixas.
				 * @param langs Idiomas preferidos.
				 * @returns URL da faixa e idioma selecionado.
				 */
				const chooseTrack = (
					tracks: any[],
					langs: string[] | undefined,
					defaultCaptionTrackIndex: number | undefined,
					defaultTranslationSourceTrackIndices: number[] | undefined,
				): { url: string; lang: string } | null => {
					const manual = tracks.filter((t) => t.kind !== 'asr' && t.baseUrl);
					const asr = tracks.filter((t) => t.kind === 'asr' && t.baseUrl);
					const scan = (list: any[]) => {
						for (const lang of langs || []) {
							const t = list.find((x) => x.languageCode === lang || x.languageCode?.toLowerCase().startsWith(lang.toLowerCase()));
							if (t) return t;
						}
						return undefined;
					};
					const direct = scan(manual) || scan(asr);
					if (direct) {
						const baseUrl: string = String(direct.baseUrl).replace('&fmt=srv3', '');
						return { url: baseUrl, lang: direct.languageCode };
					}
					if (typeof defaultCaptionTrackIndex === 'number' && tracks[defaultCaptionTrackIndex]?.baseUrl) {
						const t = tracks[defaultCaptionTrackIndex];
						return { url: String(t.baseUrl).replace('&fmt=srv3', ''), lang: t.languageCode };
					}
					if (Array.isArray(defaultTranslationSourceTrackIndices)) {
						for (const idx of defaultTranslationSourceTrackIndices) {
							if (tracks[idx]?.baseUrl) {
								const t = tracks[idx];
								return { url: String(t.baseUrl).replace('&fmt=srv3', ''), lang: t.languageCode };
							}
						}
					}
					if (manual[0]) return { url: String(manual[0].baseUrl).replace('&fmt=srv3', ''), lang: manual[0].languageCode };
					if (asr[0]) return { url: String(asr[0].baseUrl).replace('&fmt=srv3', ''), lang: asr[0].languageCode };
					return null;
				};
				/**
				 * Converte XML de legendas em segmentos. Suporta <transcript><text> e <timedtext><body><p>.
				 * @param xml Conteúdo XML.
				 * @returns Lista de segmentos normalizados em milissegundos.
				 */
				const parseSegments = (xml: string): YouTubeTranscriptSegment[] => {
					const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', trimValues: false });
					const doc = parser.parse(xml) || {};
					const transcriptTexts = doc?.transcript?.text || [];
					if (transcriptTexts && (Array.isArray(transcriptTexts) || transcriptTexts['@_start'] !== undefined)) {
						const items = Array.isArray(transcriptTexts) ? transcriptTexts : [transcriptTexts];
						return items.flatMap((n: any) => {
							const text = String(n['#text'] || '').trim();
							if (!text) return [];
							const startMs = Math.round(Number(n['@_start'] || 0) * 1000);
							const durMs = Math.round(Number(n['@_dur'] || 0) * 1000);
							return [{ text, startInMs: startMs, duration: durMs }];
						});
					}
					const body = doc?.timedtext?.body?.p || [];
					const items = Array.isArray(body) ? body : [body];
					return items.flatMap((p) => {
						const start = Number(p['@_t'] || 0);
						const duration = Number(p['@_d'] || 0);
						const texts = p.s ? (Array.isArray(p.s) ? p.s : [p.s]).map((s: any) => typeof s === 'string' ? s : s['#text'] || '') : [p['#text'] || ''];
						const text = texts.join('').trim();
						return text ? [{ text, startInMs: start, duration }] : [];
					});
				};
				try {
					const id = extractVideoId(args.videoUrl);
					if (!id) {
						console.error('Invalid YouTube URL');
						return null;
					}
					console.log(`Checking yt subtitles for video ID: ${id}`);
					const html = await fetchWatchHtml(id);
					const apiKey = extractInnertubeApiKey(html);
					if (!apiKey) {
						console.error('Failed to extract Innertube API key');
						return null;
					}
					const data = await fetchInnertubePlayer(apiKey, id);
					assertPlayability(data?.playabilityStatus);
					const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
					const audioTracks = data?.captions?.playerCaptionsTracklistRenderer?.audioTracks || [];
					const defaultCaptionTrackIndex = typeof audioTracks?.[0]?.defaultCaptionTrackIndex === 'number' ? audioTracks[0].defaultCaptionTrackIndex : undefined;
					const defaultTranslationSourceTrackIndices = data?.captions?.playerCaptionsTracklistRenderer?.defaultTranslationSourceTrackIndices as number[] | undefined;
					if (!Array.isArray(tracks) || tracks.length === 0) {
						console.error('No captions found');
						return null;
					}
					const picked = chooseTrack(tracks, args.preferredLanguages, defaultCaptionTrackIndex, defaultTranslationSourceTrackIndices);
					if (!picked) {
						console.error('No suitable track found');
						return null;
					}
					const xml = await fetchText(picked.url, { 'Accept-Language': 'en-US' });
					const segments = parseSegments(xml);
					if (!segments.length) {
						console.error('No segments found');
						return null;
					}
					return segments;
				} catch {
					return null;
				}
			},
		}];