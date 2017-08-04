import ReactChartCanvas from 'react-chart-canvas';
import Funnel from './funnel';

const FunnelChart = (props) => {
  return <ReactChartCanvas Chart={Funnel} {...props}/>;
};

export default FunnelChart;
