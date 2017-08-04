const fontHeight = 10;

export const getOffsetPixel = (width, height) => {
  const totalRatio = 1;
  // 绘图比例
  let drawRatioW = 0.5;
  if (width < 600) drawRatioW = 0.8;
  const drawRatioH = 0.7;
  return {
    w: width * drawRatioW,
    h: height * drawRatioH,
    x: width * ((totalRatio - drawRatioW) / 2),
    y: height * ((totalRatio - drawRatioH) / 2),
    size: width / 10,
  };
};

const getLineCoord = (percent, maxWidth) => {
  const divide = (1 - percent) / 2;
  return [
    maxWidth * divide,
    maxWidth * (percent + divide),
  ];
};

const computedCoord = ({ topLineCoord, bottomLineCoord, distance, maxHeight, offset }) => {
  const { x, y } = offset;
  return _.flattenDeep([topLineCoord, bottomLineCoord.slice().reverse()]).map((value, ind) => {
    if (ind <= 1) {
      return [value + x, distance + y];
    }
    return [value + x, distance + maxHeight + y];
  });
};

export const generateListObject = ({ list, offset, gap, minPercent }) => {
  const copyList = list.map((item, index) => {
    return Object.assign({}, item, { value: parseFloat(item.value) || 0, index });
  });
  const { w, h, x, y, size } = offset;
  const coordList = [];
  const leftTextList = [];
  const leftLineList = [];
  const rightTextList = [];
  const rightLineList = [];
  const centerTextList = [];
  const fillStyleList = [];

  const maxValue = _.max(_.map(copyList, 'value'));
  const minValue = maxValue * minPercent;
  const len = _.size(copyList);
  // 满足当前需求
  const gapValue = (len - 2) < 0 ? 0 : len - 2; // len - 1
  const lenValue = len <= 1 ? 1 : len - 1; // len
  const maxHeight = (h - (gapValue * gap)) / lenValue;
  // 排序从大到小，目前暂不需要
  // const sortList = _.sortBy(copyList, 'value').reverse();

  const filterMinList = copyList.filter(item => item.value <= minValue);
  const maxLimitValue = _.max(_.map(filterMinList, 'value'));

  filterMinList.forEach((item) => {
    const { index, value } = item;
    const filterPercent = ((value / maxLimitValue) * 0.1) + 0.1;
    copyList[index].createValue = maxValue * filterPercent;
  });

  copyList.forEach((item, index, array) => {
    const currentValue = item.createValue || item.value || 0;
    const after = array[index + 1] || {};
    const afeterValue = after.createValue || after.value || 0;

    const topPercent = currentValue / maxValue;
    const bottomPercent = afeterValue / maxValue;
    const distance = (maxHeight * index) + (gap * index);

    const topLineCoord = getLineCoord(topPercent, w);
    const bottomLineCoord = getLineCoord(bottomPercent, w);
    if (len === 1 || index < len - 1) {
      coordList.push(computedCoord({ topLineCoord, bottomLineCoord, distance, maxHeight, offset }));
      fillStyleList.push(item.backgroundColor);
      if (len > 1) {
        const leftX = x - (size * 1);
        const leftTextY = (distance + y + (maxHeight / 2) + fontHeight) - 1;
        const rate = ((parseFloat(after.value) / parseFloat(item.value)) * 100).toFixed(2);
        // ((bottomPercent / topPercent) * 100).toFixed(2)
        const tateText = `转化率 ${rate}%`;
        leftTextList.push([tateText, leftX, leftTextY]);
        leftLineList.push({
          x1: leftX + 10,
          x2: (topLineCoord[0] + x) + ((bottomLineCoord[0] - topLineCoord[0]) / 2),
        });
      }
    }
    const rightX = (w + x) + (size * 1);
    const rightTextY = (distance + y + fontHeight) - 1;
    centerTextList.push([item.label || item.value, (w / 2) + x, rightTextY + (fontHeight * 2)]);

    rightTextList.push([`${item.name}`, rightX, rightTextY]);
    rightLineList.push({
      x1: topLineCoord[1] + x,
      x2: rightX - 10,
    });
  });
  return { coordList, leftTextList, rightTextList, leftLineList, rightLineList, centerTextList, fillStyleList };
};


const rayCasting = (p, poly) => {
  const px = p.x;
  const py = p.y;
  let flag = false;
  const len = poly.length;

  for (let i = 0, j = len - 1; i < len; j = i, i += 1) {
    const sx = poly[i].x;
    const sy = poly[i].y;
    const tx = poly[j].x;
    const ty = poly[j].y;

    if ((sx === px && sy === py) || (tx === px && ty === py)) return true;
    if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
      const x = sx + (((py - sy) * (tx - sx)) / (ty - sy));
      if (x === px) return true;
      if (x > px) flag = !flag;
    }
  }
  return !!flag;
};

export const inWitchArea = ({ coordList, eventPosition }) => {
  if (!eventPosition) return null;
  const x = eventPosition.x * 2;
  const y = eventPosition.y * 2;
  let ind = null;
  coordList.forEach((item, index) => {
    const poly = item.map((coord) => {
      return {
        x: coord[0],
        y: coord[1],
      };
    });
    const flag = rayCasting({ x, y }, poly);

    if (flag) ind = index;
  });
  return ind;
};

const getSliceIndex = (text = '', vaildateFunc) => {
  const isExceed = vaildateFunc(text);
  if (isExceed) {
    const nextText = text.slice(0, -1);
    return getSliceIndex(nextText, vaildateFunc);
  }
  return _.size(text);
};

export const getTextList = (text, vaildateFunc) => {
  const textList = [];
  const isExceed = vaildateFunc(text);
  const len = _.size(text);
  if (isExceed) {
    let size = 0;
    let start = 0;
    while (size < len) {
      const end = getSliceIndex(text.slice(start, len), vaildateFunc) + start;
      textList.push(text.slice(start, end));
      start = end;
      size = _.size(textList.reduce((p, c) => p + c));
    }
  } else {
    textList.push(text);
  }
  return textList;
};
