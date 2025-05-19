import { useState, useEffect } from 'react';
import { Container, Grid, Card, Image, TextInput, Textarea, Button, Group, Title, Paper, SimpleGrid, Text, Loader } from '@mantine/core';
import { MultiSelect } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconTrash } from '@tabler/icons-react';
import './App.css';
const predefinedTags = [
  { value: 'motivation', label: 'Motivation' },
  { value: 'inspire', label: 'Inspire' },
  { value: 'life', label: 'Life' },
  { value: 'nature', label: 'Nature' },
  { value: 'travel', label: 'Travel' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'memories', label: 'Memories' },
  { value: 'happiness', label: 'Happiness' },
  { value: 'adventure', label: 'Adventure' },
];
const getPouchDB = () => (window as any).PouchDB;

interface Photo {
  _id: string;
  image: string;
  date: Date;
  caption: string;
  tags: string[];
  description: string;
}

interface FormState {
  file: string | null;
  date: Date;
  caption: string;
  tags: string[];
  description: string;
}

function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchCaption, setSearchCaption] = useState<string>('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [form, setForm] = useState<FormState>({
    file: null,
    date: new Date(),
    caption: '',
    tags: [],
    description: ''
  });
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const PouchDB = getPouchDB();
  console.log('PouchDB:', PouchDB);
  const retryLoading = () => {
    setDbError(null);
    setIsDbLoaded(false);
    setRetryCount((prev) => prev + 1);
  };
  useEffect(() => {
    if (PouchDB) {
      setIsDbLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      const PouchDB = getPouchDB();
      if (PouchDB) {
        setIsDbLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      if (!isDbLoaded) {
        setDbError('PouchDB failed to load after timeout. Please refresh the page or check your network.');
        clearInterval(interval);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [retryCount]);
  const db = isDbLoaded && PouchDB ? new PouchDB('photos', { adapter: 'idb' }) : null;

  useEffect(() => {
    if (!isDbLoaded) return;
    if (!db) return;

    setDbError(null);

    console.log('Initializing PouchDB...');
    db.info()
      .then((info: any) => console.log('PouchDB Info:', info))
      .catch((err: any) => {
        console.error('PouchDB Init Error:', err);
        setDbError('Failed to initialize database. Please refresh the page.');
      });

    db.allDocs({ include_docs: true })
      .then((result: { rows: any[] }) => {
        console.log('PouchDB allDocs:', result);
        const loadedPhotos = result.rows
          .map((row: { doc: any }) => row.doc as Photo)
          .filter((doc: Photo) => doc.image && doc.date)
          .map((photo: Photo) => ({
            _id: photo._id,
            image: photo.image,
            date: new Date(photo.date),
            caption: photo.caption,
            tags: photo.tags,
            description: photo.description,
          }));
        setPhotos(loadedPhotos);
      })
      .catch((err: any) => {
        console.error('Error loading photos:', err);
        setDbError('Failed to load photos. Please refresh the page.');
      });
  }, [isDbLoaded, db]);

  const handleDrop: DropzoneProps['onDrop'] = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, file: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.file) return;
    if (!db) {
      setDbError('Cannot save photo: PouchDB is not available.');
      return;
    }

    if (!form.file.startsWith('data:image/')) {
      console.error('Image is not a base64 string:', form.file);
      setDbError('Invalid image format. Please upload a valid image.');
      return;
    }

    const newPhoto: Photo = {
      _id: Date.now().toString(),
      image: form.file,
      date: form.date,
      caption: form.caption,
      tags: form.tags,
      description: form.description,
    };
    db.put(newPhoto)
      .then((response: any) => {
        console.log('Photo saved:', response);
        setPhotos([newPhoto, ...photos]);
        setForm({
          file: null,
          date: new Date(),
          caption: '',
          tags: [],
          description: '',
        });
      })
      .catch((err: any) => {
        console.error('Error saving photo:', err);
        setDbError('Failed to save photo. Please try again.');
      });
  };

  const handleDelete = (id: string) => {
    if (!db) {
      setDbError('Cannot delete photo: PouchDB is not available.');
      return;
    }

    db.get(id)
      .then((doc: any) => db.remove(doc))
      .then(() => {
        console.log('Photo deleted:', id);
        setPhotos(photos.filter((photo) => photo._id !== id));
      })
      .catch((err: any) => {
        console.error('Error deleting photo:', err);
        setDbError('Failed to delete photo. Please try again.');
      });
  };

  const filteredPhotos = photos.filter((photo) => {
    const matchesCaption = photo.caption.toLowerCase().includes(searchCaption.toLowerCase());
    const matchesTags = searchTags.length === 0 || searchTags.every((tag) => photo.tags.includes(tag));
    const matchesDate =
      !searchDate ||
      (photo.date.getFullYear() === searchDate.getFullYear() &&
        photo.date.getMonth() === searchDate.getMonth() &&
        photo.date.getDate() === searchDate.getDate());
    return matchesCaption && matchesTags && matchesDate;
  });

  if (!isDbLoaded) {
    return (
      <Container size="lg" py="xl" className="loading-container">
        <Loader size="xl" color="teal" variant="dots" />
        <Text mt="md" c="dimmed" size="lg" className="fade-in">
          Loading your memories...
        </Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl" className="app-container">
      <Title order={1} mb="xl" className="app-title fade-in">
        Photo Memory App
      </Title>

      {dbError && (
        <Paper className="error-paper fade-in" p="md" mb="xl">
          <Group justify="space-between" align="center">
            <Text c="red">{dbError}</Text>
            <Group>
              <Button variant="subtle" color="red" onClick={() => setDbError(null)}>
                Dismiss
              </Button>
              <Button variant="outline" color="red" onClick={retryLoading}>
                Retry
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      <Paper p="lg" mb="xl" className="upload-section fade-in">
        <Title order={3} mb="lg" c="deepPurple.7">
          Capture a Moment
        </Title>
        <Dropzone
          onDrop={handleDrop}
          accept={['image/*']}
          maxSize={5 * 1024 * 1024}
          mb="md"
          className="dropzone-custom"
        >
          <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={50} stroke={1.5} color="#008080" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={50} stroke={1.5} color="#ff4d4f" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={50} stroke={1.5} color="#008080" />
            </Dropzone.Idle>
            <div>
              <Text size="xl" c="teal.7">
                Drag your photo here
              </Text>
              <Text size="sm" c="dimmed">
                or click to select (max 5MB)
              </Text>
            </div>
          </Group>
        </Dropzone>

        {form.file && (
          <Image
            src={form.file}
            alt="Preview"
            height={200}
            fit="contain"
            mb="md"
            className="image-preview fade-in"
            radius="md"
          />
        )}

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <DatePickerInput
              label="Date of Memory"
              value={form.date}
              onChange={(date) => setForm({ ...form, date: date || new Date() })}
              mb="md"
              variant="filled"
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Caption"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              mb="md"
              variant="filled"
              radius="md"
              data-gramm="false"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <MultiSelect
              label="Tags"
              data={predefinedTags}
              value={form.tags}
              onChange={(tags) => setForm({ ...form, tags })}
              searchable
              mb="md"
              variant="filled"
              radius="md"
              placeholder="Select tags"
            />
          </Grid.Col>
        </Grid>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          mb="md"
          variant="filled"
          radius="md"
          data-gramm="false"
          minRows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={!form.file || !db}
          color="teal"
          size="lg"
          radius="md"
          fullWidth
        >
          Save Memory
        </Button>
      </Paper>

      <Paper p="lg" mb="xl" className="search-section fade-in">
        <Title order={3} mb="lg" c="deepPurple.7">
          Search
        </Title>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Search by Caption"
              value={searchCaption}
              onChange={(e) => setSearchCaption(e.target.value)}
              variant="filled"
              radius="md"
              data-gramm="false"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <MultiSelect
              label="Search by Tags"
              data={predefinedTags}
              value={searchTags}
              onChange={setSearchTags}
              searchable
              variant="filled"
              radius="md"
              placeholder="Select tags to filter"
              
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <DatePickerInput
              label="Search by Date"
              value={searchDate}
              onChange={setSearchDate}
              clearable
              variant="filled"
              radius="md"
            />
          </Grid.Col>
        </Grid>
      </Paper>

      <Title order={2} mb="lg" c="deepPurple.7" className="fade-in">
        Your Memories
      </Title>
      {filteredPhotos.length === 0 ? (
        <Text c="dimmed" size="lg" ta="center" className="fade-in">
          No memories found. Start by uploading a photo!
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {filteredPhotos.map((photo) => (
            <Card key={photo._id} shadow="sm" padding="lg" radius="md" withBorder className="photo-card">
              <Card.Section>
                <Image
                  src={photo.image}
                  height={200}
                  alt={photo.caption}
                  fit="cover"
                  radius="md 0 0 0"
                  className="photo-image"
                />
              </Card.Section>
              <Text fw={600} mt="md" c="teal.7" size="lg">
                {photo.caption || 'Untitled Memory'}
              </Text>
              <Text size="sm" c="dimmed" mt="xs">
                {photo.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {photo.tags.length > 0 && (
                <Group mt="xs" gap="xs">
                  {photo.tags.map((tag) => (
                    <Text key={tag} size="xs" c="deepPurple.6" className="tag">
                      #{tag}
                    </Text>
                  ))}
                </Group>
              )}
              {photo.description && (
                <Text size="sm" mt="sm" c="gray.7" className="description">
                  {photo.description}
                </Text>
              )}
              <Button
                variant="light"
                color="red"
                mt="md"
                radius="md"
                onClick={() => handleDelete(photo._id)}
                disabled={!db}
                leftSection={<IconTrash size={16} />}
                fullWidth
              >
                Delete
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}

export default App;