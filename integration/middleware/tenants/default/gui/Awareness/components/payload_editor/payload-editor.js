const PayloadEditor = (function () {

    function _populateData(schema, existing) {
        existing = existing || {};
        const data = {};
        for (const key in schema.properties) {
            const prop = schema.properties[key];
            if (existing[key] !== undefined) {
                data[key] = existing[key];
            } else if (prop.type === 'object') {
                data[key] = _populateData(prop, {});
            } else if (prop.type === 'array') {
                data[key] = [];
            } else if (prop.type === 'integer' || prop.type === 'number') {
                data[key] = 0;
            } else {
                data[key] = '';
            }
        }
        return data;
    }

    function _iconFor(type, format) {
        const base = 'middleware/pub/server/ui/icons/';
        if (type === 'string' && format === 'date') return base + 'date.svg';
        if (type === 'string')   return base + 'text.svg';
        if (type === 'number')   return base + 'number.svg';
        if (type === 'integer')  return base + 'integer.svg';
        if (type === 'boolean')  return base + 'boolean.svg';
        if (type === 'object')   return base + 'doc.svg';
        if (type === 'array')    return base + 'docList.svg';
        return base + 'text.svg';
    }

    function _arrayIconFor(itemType, itemFormat) {
        const base = 'middleware/pub/server/ui/icons/';
        if (itemType === 'string' && itemFormat === 'date') return base + 'dateArr.svg';
        if (itemType === 'string')  return base + 'textArr.svg';
        if (itemType === 'number')  return base + 'numberArr.svg';
        if (itemType === 'integer') return base + 'integerArr.svg';
        if (itemType === 'boolean') return base + 'booleanArr.svg';
        if (itemType === 'object')  return base + 'docList.svg';
        return base + 'textArr.svg';
    }

    function _primitiveInput(dataRef, key, prop, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'lb_grid';

        const icon = document.createElement('img');
        icon.src = _iconFor(prop.type, prop.format);
        wrap.appendChild(icon);

        const lbl = document.createElement('strong');
        lbl.textContent = ' ' + key + ':';
        wrap.appendChild(lbl);

        let input;
        if (prop.type === 'boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = !!dataRef[key];
            input.addEventListener('change', () => {
                dataRef[key] = input.checked;
                onChange && onChange();
            });
        } else {
            input = document.createElement('input');
            input.type = (prop.type === 'number' || prop.type === 'integer') ? 'number' : 'text';
            input.placeholder = key;
            input.value = dataRef[key] !== undefined ? dataRef[key] : '';
            if (prop.type === 'string' && prop.format === 'date') {
                input.dataset.class = 'date-picker';
            }
            input.addEventListener('input', () => {
                dataRef[key] = input.value;
                onChange && onChange();
            });
        }
        wrap.appendChild(input);
        return wrap;
    }

    function _arrayField(dataRef, key, prop, onChange) {
        if (!Array.isArray(dataRef[key])) dataRef[key] = [];

        const items = prop.items || { type: 'string' };
        const wrap  = document.createElement('div');
        wrap.className = 'json-item';

        const header = document.createElement('div');
        header.className = 'item-header';

        const headerLeft = document.createElement('span');
        const toggleSpan = document.createElement('span');
        toggleSpan.className = 'toggle-icon';
        toggleSpan.textContent = '-';
        let collapsed = false;

        const arrIcon = document.createElement('img');
        arrIcon.src = _arrayIconFor(items.type, items.format);

        const lbl = document.createElement('strong');
        lbl.textContent = key + ':';

        headerLeft.appendChild(toggleSpan);
        headerLeft.appendChild(arrIcon);
        headerLeft.appendChild(lbl);

        const addBtn = document.createElement('button');
        addBtn.className = 'array-item-add-button';
        addBtn.innerHTML = `<img src="middleware/pub/server/ui/icons/add-field.svg" alt="">`;

        header.appendChild(headerLeft);
        header.appendChild(addBtn);
        wrap.appendChild(header);

        const listEl = document.createElement('div');
        listEl.className = 'array-items-list';
        wrap.appendChild(listEl);

        function rebuildList() {
            listEl.innerHTML = '';
            dataRef[key].forEach(function (val, idx) {
                const row = document.createElement('div');
                row.className = 'array-item';

                if (items.type === 'object') {
                    // Object item — recurse
                    const objHeader = document.createElement('div');
                    objHeader.className = 'item-header';

                    const objToggle = document.createElement('span');
                    objToggle.className = 'toggle-icon';
                    objToggle.textContent = '-';
                    let objCollapsed = false;

                    const objLbl = document.createElement('strong');
                    objLbl.textContent = key + '[' + idx + ']:';

                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = `<img src="middleware/pub/server/ui/icons/delete-filed.svg" alt="">`;
                    delBtn.addEventListener('click', () => {
                        dataRef[key].splice(idx, 1);
                        rebuildList();
                        onChange && onChange();
                    });

                    objHeader.appendChild(objToggle);
                    objHeader.appendChild(objLbl);
                    objHeader.appendChild(delBtn);
                    row.appendChild(objHeader);

                    const nested = document.createElement('div');
                    nested.className = 'nested-object';
                    _renderProperties(nested, items, dataRef[key][idx], onChange);
                    row.appendChild(nested);

                    objToggle.addEventListener('click', () => {
                        objCollapsed = !objCollapsed;
                        nested.style.display = objCollapsed ? 'none' : '';
                        objToggle.textContent = objCollapsed ? '+' : '-';
                    });
                } else {
                    row.className += ' sub_obj';
                    let input;
                    if (items.type === 'boolean') {
                        input = document.createElement('input');
                        input.type = 'checkbox';
                        input.checked = !!dataRef[key][idx];
                        input.addEventListener('change', () => {
                            dataRef[key][idx] = input.checked;
                            onChange && onChange();
                        });
                    } else {
                        input = document.createElement('input');
                        input.type = (items.type === 'number' || items.type === 'integer') ? 'number' : 'text';
                        input.value = val !== undefined ? val : '';
                        if (items.type === 'string' && items.format === 'date') {
                            input.dataset.class = 'date-picker';
                        }
                        input.addEventListener('input', () => {
                            dataRef[key][idx] = input.value;
                            onChange && onChange();
                        });
                    }
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = `<img src="middleware/pub/server/ui/icons/delete-filed.svg" alt="">`;
                    delBtn.addEventListener('click', () => {
                        dataRef[key].splice(idx, 1);
                        rebuildList();
                        onChange && onChange();
                    });
                    row.appendChild(input);
                    row.appendChild(delBtn);
                }
                listEl.appendChild(row);
            });
        }

        addBtn.addEventListener('click', () => {
            let newItem;
            if (items.type === 'object') {
                newItem = _populateData(items, {});
            } else if (items.type === 'number' || items.type === 'integer') {
                newItem = 0;
            } else if (items.type === 'boolean') {
                newItem = false;
            } else {
                newItem = '';
            }
            dataRef[key].push(newItem);
            rebuildList();
            onChange && onChange();
        });

        toggleSpan.addEventListener('click', () => {
            collapsed = !collapsed;
            listEl.style.display = collapsed ? 'none' : '';
            toggleSpan.textContent = collapsed ? '+' : '-';
        });

        rebuildList();
        return wrap;
    }

    function _objectField(dataRef, key, prop, onChange) {
        if (!dataRef[key] || typeof dataRef[key] !== 'object') {
            dataRef[key] = _populateData(prop, {});
        }

        const wrap = document.createElement('div');
        wrap.className = 'json-item';

        const header = document.createElement('div');
        header.className = 'item-header';

        const toggleSpan = document.createElement('span');
        toggleSpan.className = 'toggle-icon';
        toggleSpan.textContent = '-';
        let collapsed = false;

        const lbl = document.createElement('strong');
        lbl.textContent = key + ':';

        const objIcon = document.createElement('img');
        objIcon.src = 'middleware/pub/server/ui/icons/doc.svg';
        objIcon.style.cssText = 'width:16px;height:16px;flex-shrink:0';
        header.appendChild(toggleSpan);
        header.appendChild(objIcon);
        header.appendChild(lbl);
        wrap.appendChild(header);

        const nested = document.createElement('div');
        nested.className = 'nested-object';
        _renderProperties(nested, prop, dataRef[key], onChange);
        wrap.appendChild(nested);

        toggleSpan.addEventListener('click', () => {
            collapsed = !collapsed;
            nested.style.display = collapsed ? 'none' : '';
            toggleSpan.textContent = collapsed ? '+' : '-';
        });

        return wrap;
    }

    function _renderProperties(container, schema, dataRef, onChange) {
        if (!schema || !schema.properties) return;
        container.innerHTML = '';

        for (const key in schema.properties) {
            const prop = schema.properties[key];
            let el;

            if (prop.type === 'object') {
                el = _objectField(dataRef, key, prop, onChange);
            } else if (prop.type === 'array') {
                el = _arrayField(dataRef, key, prop, onChange);
            } else {
                const itemWrap = document.createElement('div');
                itemWrap.className = 'json-item';
                itemWrap.appendChild(_primitiveInput(dataRef, key, prop, onChange));
                el = itemWrap;
            }
            container.appendChild(el);
        }
    }

    function render(container, schema, existing) {
        if (!container) return;
        if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
            container.innerHTML = '';
            return;
        }

        const data = _populateData(schema, existing || {});
        container._payloadData = data;   // store on element for getValues()
        container._payloadSchema = schema;

        container.className = (container.className || '') + ' ed_sp';
        _renderProperties(container, schema, data, null);
    }

    function getValues(container) {
        if (!container || !container._payloadData) return {};

        function coerceValue(val, prop) {
            if (prop === undefined || prop === null) return val;

            switch (prop.type) {
                case 'integer': {
                    if (val === '' || val === null || val === undefined) return undefined;
                    const n = parseInt(val, 10);
                    return isNaN(n) ? undefined : n;
                }
                case 'number': {
                    if (val === '' || val === null || val === undefined) return undefined;
                    const n = parseFloat(val);
                    return isNaN(n) ? undefined : n;
                }
                case 'boolean':
                    return typeof val === 'boolean' ? val : (val === 'true' || val === true);
                case 'string':
                    if (val === null || val === undefined || val === '') return undefined;
                    return String(val);
                case 'array': {
                    if (!Array.isArray(val)) return undefined;
                    const itemProp = prop.items || undefined;
                    return val.map(item => coerceValue(item, itemProp));
                }
                case 'object':
                    return coerceObject(val, prop);
                default:
                    return val === '' ? undefined : val;
            }
        }

        function coerceObject(obj, schema) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
            const out = {};
            for (const k in obj) {
                if (k === '_toggle') continue;
                const prop = schema && schema.properties && schema.properties[k]
                    ? schema.properties[k]
                    : null;
                out[k] = coerceValue(obj[k], prop);
            }
            return out;
        }

        return coerceObject(container._payloadData, container._payloadSchema);
    }

    return { render, getValues };
})();
