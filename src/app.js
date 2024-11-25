import { Input, message, Modal, Alert, notification, Button } from 'antd'
import { Observer, useLocalStore, useLocalObservable } from 'mobx-react-lite'
import { AlignAside, FullHeight, FullHeightAuto, Padding } from './style.js'
import { FolderOutlined, SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useEffectOnce } from 'react-use';
import { useCallback, useRef } from 'react';
import styled from 'styled-components';

const is_dev = process.env.NODE_ENV === 'development';

const FileItem = styled.div`
  margin: 5px 0;
  padding: 0 5px;
  background-color: ${prop => prop.selected ? '#eee' : 'none'};
  cursor: pointer;
  &:hover {
    background-color: #8d88;
  }
`

export default function App() {
  const local = useLocalObservable(() => ({
    isCompositing: false,
    dir_path: is_dev ? '' : 'K:\Render',
    current_play_url: '',
    search: '',
    is_fold: false,
    files: [],
    setPlayUrl(file) {
      local.current_play_url = local.dir_path + '/' + file.filename;
    }
  }));
  const playerRef = useRef(null);
  const onSearch = useCallback(async () => {
    if (!local.search) {
      return message.warning('请输入文件名')
    }
    if (!local.dir_path) {
      //return message.warning('请先选择文件夹')
      return notification.open({ message: '错误', description: '请先选择文件夹' })
    }
    const filename = local.search.trim();
    const files = await window.electron.getFilesSortTime(local.dir_path, filename);
    console.log(files)
    local.files = files;
    if (files.length) {
      if (window.electron) {
        window.electron.stopVLC().then(() => {
          window.electron.startVLC(local.dir_path + '/' + local.files[0].filename)
        })
      } else {
        local.setPlayUrl(local.files[0])
      }
    }
  })
  useEffectOnce(() => {
    if (window.electron) {
      local.dir_path = window.electron.getStoreValue('dir_path') || (is_dev ? '' : 'K:\Render');
      local.is_fold = window.electron.getStoreValue('is_fold') || false;
    }
  })
  return <Observer>{() => (
    <FullHeight>
      <Padding>
        <Input
          value={local.dir_path}
          readOnly
          placeholder='请选中文件夹路径'
          addonBefore={<FolderOutlined onClick={() => {
            window.electron.openDialog().then(result => {
              if (result.canceled === false && result.filePaths[0]) {
                const filepath = result.filePaths[0]
                window.electron.setStoreValue('dir_path', filepath)
                local.dir_path = filepath
                console.log(filepath)
              }
            })
          }}
          />}
          addonAfter={<CloseOutlined onClick={() => {
            window.electron.stopVLC();
          }} />}
        />
        <Input
          disabled={!local.dir_path}
          autoFocus
          allowClear
          style={{ marginTop: 15 }}
          addonBefore={'文件名'}
          addonAfter={<SearchOutlined onClick={onSearch} />}
          onCompositionStart={() => {
            local.isCompositing = true;
          }}
          onCompositionEnd={(e) => {
            local.isCompositing = false;
            local.search = e.target.value;
          }}
          onChange={e => {
            if (!local.isCompositing) {
              local.search = e.target.value;
            }
          }}
          onKeyDown={e => {
            if (!local.isCompositing && e.key === 'Enter') {
              onSearch();
            }
          }}
          onPaste={e => {
            console.log(e.target.value)
          }}
        />
      </Padding>
      <FullHeightAuto style={{ padding: '15px 0 15px 15px' }}>
        {/* <Button onClick={() => {
          window.electron.setTitle('test')
        }}>修改标题</Button> */}
        <AlignAside style={{ height: '100%' }}>
          <div style={{ position: 'relative', height: '100%', borderRight: '2px dashed #ccc', width: local.is_fold ? 0 : 280 }}>
            <div style={{ height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
              {!local.is_fold && local.files.map(file => (
                <FileItem
                  key={file.filename}
                  title={file.filename}
                  selected={local.current_play_url === `${local.dir_path}/${file.filename}`}
                  onClick={() => {
                    local.setPlayUrl(file);
                  }}>
                  {file.filename}
                </FileItem >
              ))}
            </div >
            <div style={{ position: 'absolute', top: 0, left: 'calc(100% + 2px)' }} onClick={() => { local.is_fold = !local.is_fold; window.electron.setStoreValue('is_fold', local.is_fold) }}>{local.is_fold ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</div>
          </div >
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <div>
              <video
                id="player"
                ref={node => playerRef.current = node}
                controls
                src={local.current_play_url ? `file://${local.current_play_url}` : ''}
                style={{ width: 720, height: 480, backgroundColor: 'black' }}
                onError={e => {
                  console.log(e, e.message)
                }}
              ></video>
            </div>
            <Button onClick={() => {
              window.location.reload();
            }}>刷新</Button>
          </div>
        </AlignAside >
      </FullHeightAuto >
    </FullHeight >
  )
  }</Observer >
}