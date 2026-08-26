import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import {
  AUDIENCE_TYPE_LABELS,
} from '../../constants/audience'
import type { Audience, AudienceFilter } from '../../types/audience'
import {
  getAudiences,
  deleteAudienceById,
  toggleAudienceStatus,
} from '../../utils/audienceStorage'
import { getValidOperatingActivitiesByAudienceId } from '../../utils/operatingActivityStorage'

const { RangePicker } = DatePicker
const { Title } = Typography

export default function AudienceListPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [data, setData] = useState<Audience[]>([])
  const [loading, setLoading] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [currentFilter, setCurrentFilter] = useState<AudienceFilter>({})

  const fetchData = useCallback((filter?: AudienceFilter) => {
    setLoading(true)
    try {
      const appliedFilter = filter ?? {}
      setCurrentFilter(appliedFilter)
      setData(getAudiences(appliedFilter))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (values: {
    name?: string
    creator?: string
    createdAtRange?: [dayjs.Dayjs, dayjs.Dayjs]
  }) => {
    const filter: AudienceFilter = {
      name: values.name,
      creator: values.creator,
      createdAtStart: values.createdAtRange?.[0]
        ?.startOf('day')
        .format('YYYY-MM-DD HH:mm:ss'),
      createdAtEnd: values.createdAtRange?.[1]
        ?.endOf('day')
        .format('YYYY-MM-DD HH:mm:ss'),
    }
    fetchData(filter)
    setCurrentPage(1)
  }

  const handleReset = () => {
    form.resetFields()
    fetchData()
    setCurrentPage(1)
  }

  const handleToggleStatus = (record: Audience) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active'
    if (newStatus === 'inactive') {
      const linkedActivities = getValidOperatingActivitiesByAudienceId(record.id)
      const hasLinkedActivity = linkedActivities.length > 0
      Modal.confirm({
        title: hasLinkedActivity
          ? '当前人群已绑定有效的运营活动，确定删除/停用？'
          : '确定要停用该人群吗？',
        content: hasLinkedActivity ? `已绑定 ${linkedActivities.length} 个有效运营活动。` : undefined,
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          toggleAudienceStatus(record.id, newStatus)
          message.success('已停用')
          fetchData(currentFilter)
        },
      })
      return
    }

    Modal.confirm({
      title: '确定要启用该人群吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        toggleAudienceStatus(record.id, newStatus)
        message.success('已启用')
        fetchData(currentFilter)
      },
    })
  }

  const handleDeleteAudience = (record: Audience) => {
    const linkedActivities = getValidOperatingActivitiesByAudienceId(record.id)
    const hasLinkedActivity = linkedActivities.length > 0
    Modal.confirm({
      title: hasLinkedActivity
        ? '当前人群已绑定有效的运营活动，确定删除/停用？'
        : '确定要删除该人群规则吗？',
      content: hasLinkedActivity ? `已绑定 ${linkedActivities.length} 个有效运营活动。` : '删除后不可恢复',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const deleted = deleteAudienceById(record.id)
        if (!deleted) {
          message.error('删除失败，人群不存在')
          return
        }
        message.success('人群规则已删除')
        fetchData(currentFilter)
      },
    })
  }

  const columns: ColumnsType<Audience> = [
    {
      title: '人群ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: '人群名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '人群描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '人群类型',
      dataIndex: 'type',
      width: 90,
      render: (type: Audience['type']) => (
        <Tag color={type === 'dynamic' ? 'blue' : 'green'}>
          {AUDIENCE_TYPE_LABELS[type]}
        </Tag>
      ),
    },
    {
      title: '人群有效期',
      key: 'validPeriod',
      width: 200,
      render: (_, record) =>
        record.validFrom && record.validTo
          ? `${record.validFrom} ~ ${record.validTo}`
          : '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: Audience['status']) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/audiences/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDeleteAudience(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          人群列表
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/audiences/create')}
        >
          创建人群
        </Button>
      </div>

      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 24, gap: '8px 0' }}
      >
        <Form.Item name="name" label="人群名称">
          <Input placeholder="请输入人群名称" allowClear style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="creator" label="创建人">
          <Input placeholder="请输入创建人" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="createdAtRange" label="创建时间">
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: currentPage,
          pageSize,
          pageSizeOptions: [10, 20],
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page)
            setPageSize(size)
          },
        }}
      />
    </div>
  )
}
