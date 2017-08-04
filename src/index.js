import ReactChartCanvas from 'react-chart-canvas';
import Gauge from './gauge';

const FunnelChart = (props) => {
  return <ReactChartCanvas Chart={Gauge} {...props}/>;
};

export default FunnelChart;
