(function () {
    function onReady(fn) {
        if (document.readyState === 'loading')
            document.addEventListener('DOMContentLoaded', fn, {
                once: true
            });
        else
            fn();
    }

    onReady(function boot() {
        const d = document;
        const el = (t, c, h) => {
            const e = d.createElement(t);
            if (c)
                e.className = c;
            if (h != null)
                e.innerHTML = h;
            return e;
        };
        const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }
                [m]));
        const safeJSON = (v) => {
            try {
                return JSON.stringify(v, null, 2);
            } catch (_) {
                return String(v);
            }
        };

        // ---------- Markdown renderer (simple & safe-ish) ----------
        function mdToHtml(md) {
            if (!md)
                return '';
            let s = escapeHtml(md);
            s = s.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
            s = s.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
            s = s.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
                .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
                .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
            s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
            s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
            s = s.replace(/(?:^|\n)([-*]\s.+)(?=\n|$)/g, (m) => {
                const items = m.trim().split(/\n/).map(l => l.replace(/^[-*]\s+/, '')).map(li => `<li>${li}</li>`).join('');
                return `<ul>${items}</ul>`;
            });
            s = s.replace(/\n{2,}/g, '\n\n').split(/\n\n/).map(p => {
                if (/^<h\d|^<ul|^<pre/.test(p.trim()))
                    return p;
                return `<p>${p.replace(/\n/g, '<br>')}</p>`;
            }).join('');
            return s;
        }

// ---------- JSON viewer (syntax colored) ----------
function makeJsonView(data) {
    const pre = el('pre', 'tw-json');
    const json = typeof data === 'string' ? (() => {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    })() : data;
    
    function syntax(v, indent = 0) {
        const spaces = '  '.repeat(indent);
        const nextSpaces = '  '.repeat(indent + 1);
        
        if (v === null)
            return `<span class="tw-j-null">null</span>`;
        
        switch (typeof v) {
        case 'number':
            return `<span class="tw-j-num">${v}</span>`;
        case 'boolean':
            return `<span class="tw-j-bool">${v}</span>`;
        case 'string':
            return `<span class="tw-j-str">"${escapeHtml(v)}"</span>`;
        case 'object':
            if (Array.isArray(v)) {
                if (!v.length)
                    return `<span class="tw-j-punc">[]</span>`;
                const inner = v.map(x => `\n${nextSpaces}${syntax(x, indent + 1)}`).join(`<span class="tw-j-punc">,</span>`);
                return `<span class="tw-j-punc">[</span>${inner}\n${spaces}<span class="tw-j-punc">]</span>`;
            } else {
                const keys = Object.keys(v);
                if (!keys.length)
                    return `<span class="tw-j-punc">{}</span>`;
                const inner = keys.map(k => 
                    `\n${nextSpaces}<span class="tw-j-key">"${escapeHtml(k)}"</span><span class="tw-j-punc">: </span>${syntax(v[k], indent + 1)}`
                ).join(`<span class="tw-j-punc">,</span>`);
                return `<span class="tw-j-punc">{</span>${inner}\n${spaces}<span class="tw-j-punc">}</span>`;
            }
        default:
            return `<span>${escapeHtml(String(v))}</span>`;
        }
    }
    
    pre.innerHTML = syntax(json);
    return pre;
}

        // ---------- agent color hashing (stable) ----------
        const cache = JSON.parse(localStorage.getItem('tw-agent-colors') || '{}');
        function hslToHex(h, s, l) {
            s /= 100;
            l /= 100;
            const k = n => (n + h / 30) % 12,
            a = s * Math.min(l, 1 - l);
            const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            const to = x => Math.round(255 * x).toString(16).padStart(2, '0');
            return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
        }
        function agentColor(id) {
            if (!id)
                return '#6e7bf3';
            if (cache[id])
                return cache[id];
            let h = 0;
            for (let i = 0; i < id.length; i++)
                h = (h * 31 + id.charCodeAt(i)) >>> 0;
            const hex = hslToHex(h % 360, 55, 58);
            cache[id] = hex;
            localStorage.setItem('tw-agent-colors', JSON.stringify(cache));
            return hex;
        }
        const softBg = (hex) => `${hex}22`;

        // ---------- type labels ----------
        const TypeDefs = {
            START: {
                cls: 'tw-title-start',
                label: 'User Request'
            },
            BEFORE_TOOL_EXECUTION: {
                cls: 'tw-title-tool',
                label: 'Tool'
            },
            AFTER_TOOL_EXECUTED: {
                cls: 'tw-title-result',
                label: 'Results'
            },
            GROUNDING_RETRIVED: {
                cls: 'tw-title-kb',
                label: 'Grounding Retrieved'
            },
            ASK_AGENT: {
                cls: 'tw-title-ask',
                label: 'Ask Agent'
            },
            AGENT_RESPONSE: {
                cls: 'tw-title-agent',
                label: 'Agent Response'
            },
            INTERNET_SEARCH: {
                cls: 'tw-title-search',
                label: 'Internet Search'
            },
            INTERNET_SEARCH_RESULT: {
                cls: 'tw-title-search',
                label: 'Search Results'
            },
            KNOWLEDGE_BASE_SEARCH: {
                cls: 'tw-title-kb',
                label: 'Knowledge Search'
            },
            KNOWLEDGE_BASE_SEARCH_RESULT: {
                cls: 'tw-title-kb',
                label: 'Knowledge Results'
            },
            TOKEN_USAGE: {
                cls: '',
                label: 'Token Usage'
            },
            FINAL_RESPONSE: {
                cls: 'tw-title-final',
                label: 'Final Response'
            },
            ERROR_RESPONSE: {
                cls: 'tw-title-error',
                label: 'Error'
            },
            PARTIAL_RESPONSE: {
                cls: 'tw-title-partial',
                label: 'Partial Response'
            },
            PARTIAL_THINKING: {
                cls: 'tw-title-think',
                label: 'Thinking…'
            },
            INTERMEDIATE_RESPONSE: {
                cls: 'tw-title-inter',
                label: 'Intermediate'
            }
        };

        // ---------- window shell ----------
        const win = el('div', 'tw-window');
        const head = el('div', 'tw-head');
        const title = el('div', 'tw-title', 'Agent Transcript');

        // Live chip with dot
        const chip = el('div', 'tw-chip');
        const dot = el('span', 'tw-dot'); // red by default
        chip.append(dot, document.createTextNode('Live'));

        const grow = el('div', 'tw-grow');
        const modeBtn = el('button', 'tw-btn', 'Light ✓'); // default light
        const minBtn = el('button', 'tw-btn', 'Minimize');
        const maxBtn = el('button', 'tw-btn', 'Maximize');
        const clearBtn = el('button', 'tw-btn', 'Clear');

        head.append(title, chip, grow, modeBtn, minBtn, maxBtn, clearBtn);

        const body = el('div', 'tw-body');
        const tree = el('div', 'tw-tree');
        body.appendChild(tree);

        win.append(head, body);
        document.body.appendChild(win);

        // Pull tab (◀)
        const pull = el('div', 'tw-pull', '&#9664;');
        document.body.appendChild(pull);

        // Toasts
        const toasts = el('div', 'tw-toasts');
        document.body.appendChild(toasts);
        const toast = (s) => {
            const t = el('div', 'tw-toast', s);
            toasts.appendChild(t);
            setTimeout(() => t.remove(), 1500);
        };

        // ---------- Light mode DEFAULT + start hidden bottom-right ----------
        document.documentElement.classList.add('tw-light');
        let light = true;
        win.classList.add('tw-min', 'tw-auto-hide');
        pull.classList.add('tw-pull-show');

        const idMap = new Map();
        const functionIndex = new Map();
        let hideTimer = null;
        let firstMessageSeen = false;
        let stoppedAfterFinal = false;

        function formatDateTime(ms) {
            if (typeof ms !== 'number')
                return '';
            const d = new Date(ms);
            const pad = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }

        // ---------- controls ----------
        function clearHideTimer() {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        }
        function scheduleAutoHide() {
            clearHideTimer();
            hideTimer = setTimeout(() => {
                if (win.classList.contains('tw-min')) {
                    win.classList.add('tw-auto-hide');
                    pull.classList.add('tw-pull-show');
                }
            }, 5000);
        }

        modeBtn.onclick = () => {
            light = !light;
            if (light)
                document.documentElement.classList.add('tw-light');
            else
                document.documentElement.classList.remove('tw-light');
            modeBtn.textContent = light ? 'Light ✓' : 'Dark';
        };

        minBtn.onclick = () => {
            win.classList.remove('tw-max');
            win.classList.add('tw-min');
            win.classList.remove('tw-auto-hide');
            pull.classList.remove('tw-pull-show');
            scheduleAutoHide();
        };

        maxBtn.onclick = () => {
            clearHideTimer();
            pull.classList.remove('tw-pull-show');
            win.classList.remove('tw-min', 'tw-auto-hide');
            win.classList.add('tw-max'); // pinned under 40px band by CSS
        };

        pull.onclick = () => {
            win.classList.remove('tw-auto-hide');
            pull.classList.remove('tw-pull-show');
            win.classList.add('tw-min'); // restored minimized bar
            scheduleAutoHide();
        };

        clearBtn.onclick = () => {
            TranscriptUI.clear();
        };

        // ---------- card builder ----------
        function card(titleText, titleClass, badgeText, headerTint, fromAgent) {
            const msg = el('div', 'tw-msg');
            const head = el('div', 'tw-msg-head');
            if (titleClass)
                head.classList.add(titleClass);
            if (headerTint)
                head.style.background = softBg(headerTint);

            const ttl = el('div', 'tw-msg-title');

            var strongAt = el('span', null, `${titleText}`);
            if (badgeText == 'ASK_AGENT' || badgeText == 'AGENT_RESPONSE')
                strongAt = el('span', null, `@${titleText}`);
            
            if (fromAgent) {
                const sep = el('span', null, ' ');
                const from = el('span', 'tw-from', `From ${fromAgent} to `);
                ttl.append(sep, from);
            }
			ttl.append(strongAt);
            const badge = el('div', 'tw-badge', badgeText || '');
            const body = el('div', 'tw-msg-body');
            const foot = el('div', 'tw-msg-foot');
            foot._left = el('div');
            foot._right = el('div');
            foot.append(foot._left, foot._right);
            head.append(ttl, badge);
            msg.append(head, body, foot);
            return {
                msg,
                head,
                body,
                foot,
                ttl,
                badge
            };
        }

        function setFooter(foot, m) {
            // Only time on the right; no agent in footer
			foot._left.textContent = '';
			if(m.tokenUsage && m.type=='FINAL_RESPONSE'){
				if(!totalAmount)
					totalAmount=0.0000;
				foot._left.textContent = ' Total tokens: '+totalTokens +' (' + totalAmount.toFixed(6) +' '+(m.tokenUsage.currency || 'USD')+')';
			}else if(m.tokenUsage)
				foot._left.textContent = 'Tokens: ' + m.tokenUsage.total+' ('+parseFloat((m.tokenUsage.amount || '0.000000')).toFixed(6)+' '+(m.tokenUsage.currency || 'USD')+')';
            foot._right.textContent = formatDateTime(m.timeStamp_ms);
        }

        // robust attach
        const attachChild = (parentNode, childNode) => {
            let anchor = parentNode;
            if (anchor && !anchor.appendChild)
                anchor = anchor.node || anchor._node || null;
            if (!anchor || !anchor.appendChild) {
                tree.appendChild(childNode);
                return;
            }
            let indent = anchor._indentEl || anchor.querySelector(':scope > .tw-indent');
            if (!indent) {
                indent = el('div', 'tw-indent');
                anchor.appendChild(indent);
            }
            anchor._indentEl = indent;
            indent.appendChild(childNode);
        };

		function createTabs(c, text,m){
			
			const bar = el('div', '');
            bar.style.display = 'flex';
            bar.style.gap = '.35rem';
            bar.style.marginBottom = '.4rem';
            const btnA = el('button', 'tw-btn', 'Message');
            const btnB = el('button', 'tw-btn', 'JSON');
			const btnC = el('button', 'tw-btn', 'CoT');
            btnA.style.background = 'rgba(0,0,0,.06)';

            const paneA = el('div', 'tw-md');
            paneA.innerHTML = mdToHtml(text || '');
            const paneB = makeJsonView(m);
            paneB.style.display = 'none';
			
			const paneC = el('div', 'tw-md');
            paneC.innerHTML = mdToHtml(m.reasoning || '');
			paneC.style.display = 'none';
			
            btnA.onclick = () => {
                paneA.style.display = 'block';
                paneB.style.display = 'none';
				paneC.style.display = 'none';
                btnC.style.background = 'transparent';
				btnA.style.background = 'rgba(0,0,0,.06)';
                btnB.style.background = 'transparent';
            };
            btnB.onclick = () => {
                paneA.style.display = 'none';
				paneC.style.display = 'none';
                paneB.style.display = 'block';
                btnC.style.background = 'transparent';
				btnB.style.background = 'rgba(0,0,0,.06)';
                btnA.style.background = 'transparent';
            };
			
			btnC.onclick = () => {
                paneA.style.display = 'none';
                paneB.style.display = 'none';
                paneC.style.display = 'block';
				btnC.style.background = 'rgba(0,0,0,.06)';
                btnA.style.background = 'transparent';
				btnB.style.background = 'transparent';
            };

            c.body.append(bar);
            if(m.reasoning)
				bar.append(btnA, btnB, btnC);
			else
				bar.append(btnA, btnB);
            c.body.append(paneA, paneB,paneC);
            setFooter(c.foot, m);
            return c.msg;
		}
		
		function createHtmlTabs(c, div,m){
			
			const bar = el('div', '');
            bar.style.display = 'flex';
            bar.style.gap = '.35rem';
            bar.style.marginBottom = '.4rem';
            const btnA = el('button', 'tw-btn', 'Message');
            const btnB = el('button', 'tw-btn', 'JSON');
            btnA.style.background = 'rgba(0,0,0,.06)';

            const paneA = el('div', 'tw-md');
            paneA.append(div);
            const paneB = makeJsonView(m);
            paneB.style.display = 'none';

            btnA.onclick = () => {
                paneA.style.display = 'block';
                paneB.style.display = 'none';
                btnA.style.background = 'rgba(0,0,0,.06)';
                btnB.style.background = 'transparent';
            };
            btnB.onclick = () => {
                paneA.style.display = 'none';
                paneB.style.display = 'block';
                btnB.style.background = 'rgba(0,0,0,.06)';
                btnA.style.background = 'transparent';
            };

            c.body.append(bar);
            bar.append(btnA, btnB);
            c.body.append(paneA, paneB);
            setFooter(c.foot, m);
            return c.msg;
		}

        // ---------- renderers ----------
        function renderSTART(m) {
            const c = card('User Request', TypeDefs.START.cls, 'START');
            const summary = m?.args?.prompt || m.context || (Array.isArray(m.result) ? m.result.join('\n') : (m.result || ''));
            return createTabs(c,summary,m);
        }

        function renderASK_AGENT(m) {
            const toName = m.to_agentName || m.to_agentId || 'Agent';
            const fromName = m.agentName || m.agentId || 'Agent';
            const id = m.agentId || m.requesterAID || m.servingAID || toName;
            const headerHex = agentColor(id);
            const c = card(toName, TypeDefs.ASK_AGENT.cls, 'ASK_AGENT', headerHex, fromName);
            const text = m?.args?.prompt || '';
            setFooter(c.foot, m);
            return createTabs(c,text,m);
        }

        function extractAgentResp(m) {
            if (Array.isArray(m.result) && m.result.length) {
                const first = m.result[0];
                if (typeof first === 'string') {
                    try {
                        const obj = JSON.parse(first);
                        if (obj && typeof obj === 'object' && ('resp' in obj))
                            return String(obj.resp);
                    } catch (_) {}
                } else if (first && typeof first === 'object' && ('resp' in first)) {
                    return String(first.resp);
                }
                return m.result.map(x => typeof x === 'string' ? x : safeJSON(x)).join('\n');
            }
            if (typeof m.result === 'string') {
                try {
                    const obj = JSON.parse(m.result);
                    if (obj && typeof obj === 'object' && ('resp' in obj))
                        return String(obj.resp);
                } catch (_) {}
                return m.result;
            }
            if (m.result && typeof m.result === 'object' && ('resp' in m.result))
                return String(m.result.resp);
            return safeJSON(m.result);
        }

        function renderAGENT_RESPONSE(m) {
            const toName = (typeof m.context === 'string' && m.context) || m.agentName || 'Agent';
            const fromName = m.agentName || m.agentId || 'Agent';
            const id = m.agentId || m.servingAID || m.requesterAID || toName;
            const headerHex = agentColor(id);
            const c = card(toName, TypeDefs.AGENT_RESPONSE.cls, 'AGENT_RESPONSE', headerHex, fromName);
            const respText = extractAgentResp(m);
            //const md = el('div', 'tw-md');
            //md.innerHTML = mdToHtml(respText || '');
            //c.body.append(md);
            setFooter(c.foot, m);
            return createTabs(c,respText,m);
        }
let toolWait={};
        function renderBEFORE_TOOL_EXECUTION(m) {
            const c = card(TypeDefs.BEFORE_TOOL_EXECUTION.label, TypeDefs.BEFORE_TOOL_EXECUTION.cls, 'BEFORE_TOOL_EXECUTION');
            const row = el('div', '');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '.5rem';
            const spin = el('div', 'tw-spinner');
            const link = el('span', 'tw-link', m.functionName || 'Tool');
            row.append(spin, link);
			toolWait[m.functionID]=spin;
            //c.body.append(row);
			createHtmlTabs(c,row,m);
            const details = el('div', ''); // collapsed by default
            details.style.display = 'none';
            details.style.borderTop = '1px dashed var(--border)';
            details.style.marginTop = '.5rem';
            details.style.paddingTop = '.5rem';

            const meta = makeJsonView({
                function : m.functionName, args: m.args, time: m.timeStamp_ms
        });
    details.append(meta);

    const less = el('div', 'tw-link', 'show less');
    less.style.marginTop = '.35rem';
    less.onclick = () => details.style.display = 'none';
    link.onclick = () => details.style.display = (details.style.display === 'none') ? 'block' : 'none';

    details.append(less);
    c.body.append(details);
    c._spinner = spin;
    c._details = details;
    setFooter(c.foot, m);
    return c.msg;
}

function renderAFTER_TOOL_EXECUTED(m, beforeMsg) {
    const c = card(TypeDefs.AFTER_TOOL_EXECUTED.label, TypeDefs.AFTER_TOOL_EXECUTED.cls, 'AFTER_TOOL_EXECUTED');
    let took = null;
    if (beforeMsg && typeof beforeMsg.timeStamp_ms === 'number' && typeof m.timeStamp_ms === 'number') {
        took = m.timeStamp_ms - beforeMsg.timeStamp_ms;
    }
    const headRow = el('div', '', `<span class="tw-pill">Time: ${took != null ? (took + ' ms') : '–'}</span>`);
    const res = makeJsonView(typeof m.result === 'string' ? (() => {
                try {
                    return JSON.parse(m.result);
                } catch {
                    return m.result;
                }
            })() : m.result);
    c.body.append(headRow, res);
    setFooter(c.foot, m);
	// Live chip with dot
    const chip = el('div', 'tw-chip');
    const dot = el('span', 'tw-dot live'); // GREEN by default
    chip.append(dot);
	toolWait[m.functionID].classList.remove('tw-spinner');
	toolWait[m.functionID].append(chip);
    return c.msg;
}

function renderGROUNDING_RETRIVED(m) {
    const c = card(TypeDefs.GROUNDING_RETRIVED.label, TypeDefs.GROUNDING_RETRIVED.cls, 'GROUNDING_RETRIVED');
    //c.body.append(makeJsonView(m.result || m.args || {}));
	setFooter(c.foot, m);
    return createTabs(c,m.result,m);
}
function renderINTERNET_SEARCH(m) {
    const c = card(TypeDefs.INTERNET_SEARCH.label, TypeDefs.INTERNET_SEARCH.cls, 'INTERNET_SEARCH');
    c.body.append(makeJsonView(m.args || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderINTERNET_SEARCH_RESULT(m) {
    const c = card(TypeDefs.INTERNET_SEARCH_RESULT.label, TypeDefs.INTERNET_SEARCH_RESULT.cls, 'INTERNET_SEARCH_RESULT');
    c.body.append(makeJsonView(m.result || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderKNOWLEDGE_BASE_SEARCH(m) {
    const c = card(TypeDefs.KNOWLEDGE_BASE_SEARCH.label, TypeDefs.KNOWLEDGE_BASE_SEARCH.cls, 'KNOWLEDGE_BASE_SEARCH');
    c.body.append(makeJsonView(m.args || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderKNOWLEDGE_BASE_SEARCH_RESULT(m) {
    const c = card(TypeDefs.KNOWLEDGE_BASE_SEARCH_RESULT.label, TypeDefs.KNOWLEDGE_BASE_SEARCH_RESULT.cls, 'KNOWLEDGE_BASE_SEARCH_RESULT');
    //c.body.append(makeJsonView(m.result || {}));
    setFooter(c.foot, m);
    return createTabs(c,m.result,m);
}
function renderFINAL_RESPONSE(m) {
    const c = card(TypeDefs.FINAL_RESPONSE.label, TypeDefs.FINAL_RESPONSE.cls, 'FINAL_RESPONSE');
    const txt = (typeof m.result === 'string') ? m.result : (Array.isArray(m.result) ? m.result.join('\n') : safeJSON(m.result));
    const md = el('div', 'tw-md');
    //md.innerHTML = mdToHtml(txt || '');
    //c.body.append(md);
    setFooter(c.foot, m);
    return createTabs(c,txt,m);
}
function renderERROR_RESPONSE(m) {
    const c = card(TypeDefs.ERROR_RESPONSE.label, TypeDefs.ERROR_RESPONSE.cls, 'ERROR_RESPONSE');
    c.body.append(makeJsonView(m.error ? {
            error: m.error
        }
             : m.result || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderPARTIAL_RESPONSE(m) {
    const c = card(TypeDefs.PARTIAL_RESPONSE.label, TypeDefs.PARTIAL_RESPONSE.cls, 'PARTIAL_RESPONSE');
    c.body.append(makeJsonView(m.result || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderPARTIAL_THINKING(m) {
    const c = card(TypeDefs.PARTIAL_THINKING.label, TypeDefs.PARTIAL_THINKING.cls, 'PARTIAL_THINKING');
    c.body.append(makeJsonView(m.result || {}));
    setFooter(c.foot, m);
    return c.msg;
}
function renderINTERMEDIATE_RESPONSE(m) {
    const c = card(TypeDefs.INTERMEDIATE_RESPONSE.label, TypeDefs.INTERMEDIATE_RESPONSE.cls, 'INTERMEDIATE_RESPONSE');
    c.body.append(makeJsonView(m.result || {}));
    setFooter(c.foot, m);
    return c.msg;
}

// ---------- dispatcher ----------
function renderMessage(msg) {
    const t = msg.type;
    let node = null;

    if (t === 'START')
        node = renderSTART(msg);
    else if (t === 'ASK_AGENT')
        node = renderASK_AGENT(msg);
    else if (t === 'AGENT_RESPONSE')
        node = renderAGENT_RESPONSE(msg);
    else if (t === 'BEFORE_TOOL_EXECUTION') {
        const beforeNode = renderBEFORE_TOOL_EXECUTION(msg);
        node = beforeNode;
        if (msg.functionID) {
            const rec = functionIndex.get(msg.functionID) || {};
            rec.before = {
                msg,
                node: beforeNode,
                spinner: beforeNode._spinner,
                details: beforeNode._details
            };
            functionIndex.set(msg.functionID, rec);
        }
    } else if (t === 'AFTER_TOOL_EXECUTED') {
        const rec = msg.functionID && functionIndex.get(msg.functionID);
        const inner = renderAFTER_TOOL_EXECUTED(msg, rec?.before?.msg);
        if (rec && rec.before && rec.before.details) {
            rec.before.spinner && rec.before.spinner.remove();
            // keep collapsed by default; appended inside details (still display:none)
            rec.before.details.append(inner);
            node = null; // nested
        } else
            node = inner;
    } else if (t === 'GROUNDING_RETRIVED')
        node = renderGROUNDING_RETRIVED(msg);
    else if (t === 'INTERNET_SEARCH')
        node = renderINTERNET_SEARCH(msg);
    else if (t === 'INTERNET_SEARCH_RESULT')
        node = renderINTERNET_SEARCH_RESULT(msg);
    else if (t === 'KNOWLEDGE_BASE_SEARCH')
        node = renderKNOWLEDGE_BASE_SEARCH(msg);
    else if (t === 'KNOWLEDGE_BASE_SEARCH_RESULT')
        node = renderKNOWLEDGE_BASE_SEARCH_RESULT(msg);
    else if (t === 'FINAL_RESPONSE') {
        node = renderFINAL_RESPONSE(msg);
        stoppedAfterFinal = true;
    } else if (t === 'ERROR_RESPONSE')
        node = renderERROR_RESPONSE(msg);
    else if (t === 'PARTIAL_RESPONSE')
        node = renderPARTIAL_RESPONSE(msg);
    else if (t === 'PARTIAL_THINKING')
        node = renderPARTIAL_THINKING(msg);
    else if (t === 'INTERMEDIATE_RESPONSE')
        node = renderINTERMEDIATE_RESPONSE(msg);
    /*else {
        const c = card(t || 'Message', '', t || 'MSG');
        c.body.append(makeJsonView(m.result || m.args || m.context || {}));
        node = c.msg;
    }*/

    if (!node)
        return;
    if (msg.parentID && idMap.get(msg.parentID))
        attachChild(idMap.get(msg.parentID), node);
    else
        tree.appendChild(node);
    idMap.set(msg.id, node);
}

let totalTokens=0;
let totalAmount=0;

// ---------- public API ----------
window.TranscriptUI = {
    addMessage(m) {
        if (stoppedAfterFinal)
            return; // ignore anything after FINAL_RESPONSE
        try {
            if (typeof m === 'string')
                m = JSON.parse(m);
        } catch (_) {}
        if (!m || typeof m !== 'object')
            return;
		if(m.tokenUsage){
			totalTokens+=m.tokenUsage.total;
			totalAmount+=parseFloat(m.tokenUsage.amount);
		}
	
        renderMessage(m);

        if (!firstMessageSeen) {
            firstMessageSeen = true;
            dot.classList.add('live'); // turn green
        }
    },
    disconnect() {
        dot.classList.remove('live');
    },
    clear() {
        // wipe data + UI; keep window in minimized auto-hidden state & reset live dot
        idMap.clear();
        functionIndex.clear();
        stoppedAfterFinal = false;
        firstMessageSeen = false;
        dot.classList.remove('live'); // red
        tree.innerHTML = '';
		totalTokens=0;
		totalAmount=0;
        // keep minimized & hidden pull state
        //win.classList.add('tw-min','tw-auto-hide');
        //pull.classList.add('tw-pull-show');
    },
	slideOut(){
		if (!win.classList.contains('tw-max')){
			win.classList.remove('tw-max');
			win.classList.add('tw-min');
			win.classList.remove('tw-auto-hide');
			pull.classList.remove('tw-pull-show');
			scheduleAutoHide();
		}
	},
    open() {
        win.classList.remove('tw-min', 'tw-auto-hide');
        pull.classList.remove('tw-pull-show');
    },
    close() { /* persistent */
    },
    setTheme(mode) {
        const toLight = (mode === 'light');
        if (toLight)
            document.documentElement.classList.add('tw-light');
        else
            document.documentElement.classList.remove('tw-light');
        light = toLight;
        modeBtn.textContent = light ? 'Light ✓' : 'Dark';
    },
    saveTheme() { /* not used */
    }
};
});
})();
