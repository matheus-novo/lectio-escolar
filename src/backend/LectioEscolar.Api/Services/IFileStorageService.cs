namespace LectioEscolar.Api.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder = "");
        Task DeleteFileAsync(string fileName, string subFolder = "");
        string GetPhysicalPath(string fileName, string subFolder = "");
        bool FileExists(string fileName, string subFolder = "");
    }
}