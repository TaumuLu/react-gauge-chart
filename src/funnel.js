import { getHoverRgbColor } from 'color-conversion-rgb';
import {
  getOffsetPixel, generateListObject, inWitchArea, getTextList
} from './config';

/*
* props: {
    list: [
      { name: 'Q1', value: 500, backgroundColor: '', ... },
      { name: 'Q2', value: 400, backgroundColor: '' },
      { name: 'Q3', value: 300, backgroundColor: '' },
      { name: 'Q4', value: 200, backgroundColor: '' },
    ],
    isGradient: false,
    labelStyle: '#333',
    dataStyle: '#000',
    strokeStyle: '#000',
    tooltipStyle: {},
    minPercent: 0.2,
* }
*/

export default class Funnel {
  constructor(props) {
    this.setValue(props);
  }

  setValue = (props = {}) => {
    this.labelStyle = props.labelStyle || this.labelStyle || '#333';
    this.dataStyle = props.dataStyle || this.dataStyle || '#000';
    this.strokeStyle = props.strokeStyle || this.strokeStyle || '#000';
    if (this.isGradient === undefined) {
      this.isGradient = props.isGradient === undefined ? false : props.isGradient;
    } else {
      this.isGradient = props.isGradient === undefined ? this.isGradient : props.isGradient;
    }

    this.ratio = props.ratio || this.ratio || 1;
    this.list = props.list || this.list || [];
    this.gap = props.gap || this.gap || 2;
    this.width = props.width || this.width || 250;
    this.height = props.height || this.height || 250;
    this.fontSize = props.fontSize || this.fontSize || 12;
    this.minPercent = props.minPercent || this.minPercent || 0.2;
    // 事件
    this.eventPosition = props.eventPosition;
    this.event = props.event;
    // generate
    this.offset = getOffsetPixel(this.width, this.height);
    this.hasText = this.width > 600;
    const object = generateListObject({ list: this.list, offset: this.offset, gap: this.gap, minPercent: this.minPercent });

    this.coordList = object.coordList;
    this.leftTextList = object.leftTextList;
    this.leftLineList = object.leftLineList;
    this.rightTextList = object.rightTextList;
    this.rightLineList = object.rightLineList;
    this.centerTextList = object.centerTextList;
    this.fillStyleList = object.fillStyleList;
  }

  update = (props, ctx) => {
    this.setValue(props);
    this.currentArea = inWitchArea({
      coordList: this.coordList,
      eventPosition: this.eventPosition,
      offset: this.offset,
      ctx,
    });
    this.draw(ctx);
    const item = this.list[this.currentArea];
    if (item) {
      const nextItem = this.list[+this.currentArea + 1] || {};
      const rateText = _.get(this.leftTextList[this.currentArea] || [], ['0'], '转化率 0%');
      return Object.assign({ rateText, nextItem }, item);
    }
    return null;
  }

  getTextWidth = (ctx, fillX, direction) => (text) => {
    const { width } = ctx.measureText(text);
    if (direction === 'start') {
      return width + fillX > this.width;
    }
    return fillX - width < 0;
  }

  computedDrawText = (ctx, param, direction) => {
    // 文字的宽度是否超出canvas
    const fillText = param[0];
    const fillX = param[1];
    let fillY = param[2];
    const curryGetTextWidth = this.getTextWidth(ctx, fillX, direction);
    let textList = [];
    if (direction === 'end') {
      const isExceed = curryGetTextWidth(fillText);
      if (isExceed) {
        textList = fillText.split(' ');
        if (_.size(textList) < 1) {
          textList = getTextList(fillText, curryGetTextWidth);
        }
      } else {
        textList.push(fillText);
      }
    } else {
      textList = getTextList(fillText, curryGetTextWidth);
    }
    const size = _.size(textList);
    if (size > 1) {
      fillY -= 10 * size;
    }
    textList.forEach((value, index) => {
      ctx.fillText(value, fillX, fillY + (index * 25));
    });
  }

  drawText = (ctx) => {
    const realFontSize = this.fontSize * this.ratio;
    const lineWidth = 2;
    ctx.font = `${realFontSize}px Helvetica Neue For Number`;
    ctx.fillStyle = this.labelStyle;
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = lineWidth;

    if (this.hasText) {
      ctx.textAlign = 'start';
      const rightLen = _.size(this.rightTextList);
      this.rightTextList.forEach((param, index) => {
        const initY = param[2] - 10;
        // 额外计算两图表之间的缝隙
        const y = rightLen === 1 ? initY + lineWidth :
          index === rightLen - 1 ? initY - lineWidth : initY + lineWidth;
        const coordX = this.rightLineList[index];
        ctx.beginPath();
        ctx.moveTo(coordX.x1, y);
        ctx.lineTo(coordX.x2, y);
        ctx.stroke();
        ctx.closePath();

        this.computedDrawText(ctx, param, ctx.textAlign);
      });

      ctx.textAlign = 'end';
      this.leftTextList.forEach((param, index) => {
        const initY = param[2] - 10;
        const y = initY + (lineWidth / 2);
        const coordX = this.leftLineList[index];
        ctx.beginPath();
        ctx.moveTo(coordX.x1, y);
        ctx.lineTo(coordX.x2, y);
        ctx.stroke();
        ctx.closePath();

        this.computedDrawText(ctx, param, ctx.textAlign);
      });
    }

    ctx.textAlign = 'center';
    this.centerTextList.forEach((param, index) => {
      if (index === this.currentArea) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = this.dataStyle;
      }
      ctx.fillText(...param);
    });
  }

  drawFunnel = (ctx) => {
    ctx.translate(0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.coordList.forEach((item, index) => {
      ctx.beginPath();
      let start;
      let end;
      item.forEach((param, ind) => {
        if (ind === 0) {
          ctx.moveTo(...param);
          start = param[1];
        } else {
          ctx.lineTo(...param);
          end = param[1];
        }
      });
      const color = this.fillStyleList[index];
      if (index === this.currentArea) {
        ctx.fillStyle = getHoverRgbColor(color);
      } else if (this.isGradient) {
        const gradient = ctx.createLinearGradient(0, start, 0, end);
        gradient.addColorStop('0', getHoverRgbColor(color, 1));
        gradient.addColorStop('1', getHoverRgbColor(color, 0.2));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = color;
      }
      ctx.closePath();
      ctx.fill();
    });
  }

  draw = (ctx) => {
    this.drawFunnel(ctx);
    this.drawText(ctx);
  }
}
