import styled from 'styled-components'

export const Right = styled.div`
  text-align: right;
  flex: 1;
`;
export const CenterXY = styled.div`
height: 100%;
display: flex;
align-items: center;
justify-content: center;
`;

export const AlignAside = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
`;

export const AlignAround = styled.div`
display: flex;
justify-content: space-around;
align-items: center;
`;

export const AlignVertical = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: column;
`;

export const FullHeight = styled.div`
display: flex;
flex-direction: column;
height: 100%;
`;

export const FullHeightFix = styled.div`
display: flex;
flex-direction: row;
align-items: flex-start;
`;

export const FullHeightAuto = styled.div`
/* flex-grown flex-shink flex-basis */
flex: 1;
overflow-y: auto;
`;

export const FullWidth = styled.div`
display: flex;
flex-direction: row;
align-items: center;
align-content: center;
`;

export const FullWidthFix = styled.div`
display: flex;
flex-direction: row;
`;

export const FullWidthAuto = styled.div`
flex: 1;
`;

export const Padding = styled.div`
  padding: 15px;
`

export const PaddingSide = styled.div`
  padding: 0 15px;
`
export const padding = {
  padding: 15
}

export const paddingSide = {
  padding: '0 15px'
}