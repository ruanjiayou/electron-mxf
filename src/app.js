import { Input, message, Modal, Alert, notification, Button, Select } from 'antd'
import { Observer, useLocalStore, useLocalObservable } from 'mobx-react-lite'
import { AlignAside, FullHeight, FullHeightAuto, Padding } from './style.js'
import { FolderOutlined, SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useEffectOnce } from 'react-use';
import { useCallback, useRef } from 'react';
import styled from 'styled-components';
import * as CONST from './const.js';

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
    dir_path: is_dev ? '' : 'K:\\Render',
    current_play_url: '',
    file_suffix: 'mxf',
    search: '',
    files: [],
    [CONST.STORE.IS_FOLD]: true,
    [CONST.STORE.SHOW_DIR]: false,
    [CONST.STORE.SHOW_VIDEO]: false,
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
    const files = await window.electron[CONST.EVENT.GetFilesSortByTime](local.dir_path, filename, local.file_suffix);
    local.files = files;
    if (files.length) {
      local.setPlayUrl(local.files[0])
      if (window.electron) {
        window.electron[CONST.EVENT.StopVlc]().then(() => {
          window.electron[CONST.EVENT.StartVlc](local.dir_path + '/' + local.files[0].filename)
        })
      }
    }
  })
  useEffectOnce(() => {
    if (window.electron) {
      local.dir_path = window.electron.getStoreValue(CONST.STORE.DIR_PATH) || (is_dev ? '' : 'K:\\Render');
      local.file_suffix = window.electron.getStoreValue(CONST.STORE.FILE_SUFFIX) || 'mxf';
      local[CONST.STORE.IS_FOLD] = window.electron.getStoreValue(CONST.STORE.IS_FOLD) || false;
      local[CONST.STORE.SHOW_DIR] = window.electron.getStoreValue(CONST.STORE.SHOW_DIR) || false;
      local[CONST.STORE.SHOW_VIDEO] = window.electron.getStoreValue(CONST.STORE.SHOW_VIDEO) || false;
    }
    window.onmessage = function (e) {
      try {
        const data = JSON.parse(e.data);
        if (data.command === CONST.STORE.SHOW_DIR) {
          local[CONST.STORE.SHOW_DIR] = data.value;
        } else if (data.command === CONST.STORE.SHOW_VIDEO) {
          local[CONST.STORE.SHOW_VIDEO] = data.value;
        }
      } catch (e) {

      }
    }
  })
  return <Observer>{() => (
    <FullHeight>
      <Padding style={{ display: local[CONST.STORE.SHOW_DIR] ? 'flex' : 'none', flexDirection: 'row' }}>
        <Input
          value={local.dir_path}
          readOnly
          placeholder='请选中文件夹路径'
          addonBefore={<FolderOutlined onClick={() => {
            window.electron[CONST.EVENT.OpenDialog]().then(result => {
              if (result.canceled === false && result.filePaths[0]) {
                const filepath = result.filePaths[0]
                window.electron.setStoreValue(CONST.STORE.DIR_PATH, filepath)
                local.dir_path = filepath
              }
            })
          }}
          />}
          addonAfter={<CloseOutlined onClick={() => {
            window.electron[CONST.EVENT.StopVlc]();
          }} />}
        />
        <Button style={{ marginLeft: 10 }} onClick={() => {
          window.location.reload();
        }}>刷新</Button>
      </Padding>
      <Padding>
        <Input
          disabled={!local.dir_path}
          autoFocus
          allowClear
          addonBefore={<Select value={local.file_suffix} onSelect={v => {
            local.file_suffix = v;
            window.electron.setStoreValue(CONST.STORE.FILE_SUFFIX, v)
          }}>
            <Select.Option value="mxf"></Select.Option>
            <Select.Option value="mp4"></Select.Option>
          </Select>}
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
              {!local[CONST.STORE.IS_FOLD] && local.files.map(file => (
                <FileItem
                  key={file.filename}
                  title={file.filename}
                  selected={local.current_play_url === `${local.dir_path}/${file.filename}`}
                  onClick={() => {
                    local.setPlayUrl(file)
                    if (window.electron) {
                      window.electron[CONST.EVENT.StopVlc]().then(() => {
                        window.electron[CONST.EVENT.StartVlc](local.dir_path + '/' + file.filename)
                      })
                    }
                  }}>
                  {file.filename}
                </FileItem >
              ))}
            </div >
            <div style={{ position: 'absolute', top: 0, left: 'calc(100% + 2px)' }} onClick={() => { local[CONST.STORE.IS_FOLD] = !local.is_fold; window.electron.setStoreValue(CONST.STORE.IS_FOLD, local[CONST.STORE.IS_FOLD]) }}>{local[CONST.STORE.IS_FOLD] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</div>
          </div >
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <div style={{ display: local[CONST.STORE.SHOW_VIDEO] ? 'block' : 'none' }}>
              <video
                id="player"
                ref={node => playerRef.current = node}
                controls
                autoPlay={false}
                src={local.current_play_url ? `file://${local.current_play_url}` : ''}
                style={{ width: 450, height: 300, backgroundColor: 'black' }}
                onError={e => {
                  console.log(e, e.message)
                }}
              ></video>
            </div>
          </div>
        </AlignAside >
      </FullHeightAuto >
    </FullHeight >
  )
  }</Observer >
}