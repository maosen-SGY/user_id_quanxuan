import { Layout, Menu, Typography } from 'antd'
import { NotificationOutlined, TeamOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  let selectedKey = ''
  if (location.pathname.startsWith('/audiences')) {
    selectedKey = 'audiences'
  }
  if (location.pathname.startsWith('/operating-activity')) {
    selectedKey = 'operating-activity'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Kalodata 营销后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'audiences',
              icon: <TeamOutlined />,
              label: '人群圈选',
              onClick: () => navigate('/audiences'),
            },
            {
              key: 'operating-activity',
              icon: <NotificationOutlined />,
              label: '运营活动',
              onClick: () => navigate('/operating-activity/create'),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            人群圈选管理
          </Title>
        </Header>
        <Content style={{ margin: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
